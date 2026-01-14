import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import errorMiddleware from "./middlewares/error.middleware";
import { ENV } from "./config/env";

const app = express();

/**
 * REQUIRED for Render / proxies
 */
app.set("trust proxy", 1);

/**
 * Security headers
 */
app.use(helmet());

/**
 * ✅ CORS CONFIGURATION (FIXED)
 * Supports:
 * - Vercel production domain
 * - Vercel preview deployments
 * - Local development
 * - Non-browser requests (Render health checks, Postman)
 */
const allowedOrigins = [
  "https://mibo-alt-v2.vercel.app",
  "https://mibo-alt-v2-git-main-nithin-nazars-projects.vercel.app",
  "http://localhost:5173", // Local development
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / health check / Postman
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

/**
 * Body parsing
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * HTTP logging
 */
if (ENV.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

/**
 * Global rate limiting
 * 100 requests / minute / IP
 */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later",
    },
  },
});

app.use(globalLimiter);

/**
 * Authentication rate limiting
 * 5 requests / minute / IP
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts, please try again later",
    },
  },
});

/**
 * Apply auth rate limiter
 */
app.use("/api/auth/send-otp", authLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/patient-auth/send-otp", authLimiter);
app.use("/api/patient-auth/verify-otp", authLimiter);
app.use("/api/booking/initiate", authLimiter);
app.use("/api/booking/confirm", authLimiter);

/**
 * Request timeout (30s)
 */
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({
      success: false,
      error: {
        code: "REQUEST_TIMEOUT",
        message: "Request timeout",
      },
    });
  });
  next();
});

/**
 * Health check endpoint for AWS Elastic Beanstalk / Load Balancer
 * Returns 200 OK to indicate the application is running
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: ENV.NODE_ENV,
  });
});

/**
 * Root endpoint
 * Returns basic API information
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mibo Mental Health API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      api: "/api",
    },
  });
});

/**
 * API routes
 */
app.use("/api", routes);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

/**
 * Global error handler (must be last)
 */
app.use(errorMiddleware);

export default app;

// CORS----ISSUE___
// import express from "express";
// import cors from "cors";
// import morgan from "morgan";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import routes from "./routes";
// import errorMiddleware from "./middlewares/error.middleware";
// import { ENV } from "./config/env";

// const app = express();

// app.set("trust proxy", 1); // ✅ REQUIRED on Render

// // Security headers
// app.use(helmet());

// // CORS configuration
// app.use(
//   cors({
//     origin: ENV.CORS_ORIGIN,
//     credentials: true,
//   })
// );

// // Body parser with size limits
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// // HTTP request logging
// if (ENV.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// } else {
//   app.use(morgan("combined"));
// }

// // Global rate limiting (100 requests per minute per IP)
// const globalLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 100,
//   message: {
//     success: false,
//     error: {
//       code: "RATE_LIMIT_EXCEEDED",
//       message: "Too many requests, please try again later",
//     },
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(globalLimiter);

// // Authentication rate limiting (5 requests per minute per IP)
// const authLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 5,
//   message: {
//     success: false,
//     error: {
//       code: "AUTH_RATE_LIMIT_EXCEEDED",
//       message: "Too many authentication attempts, please try again later",
//     },
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// // Apply auth rate limiter to authentication routes
// app.use("/api/auth/send-otp", authLimiter);
// app.use("/api/auth/login", authLimiter);
// app.use("/api/patient-auth/send-otp", authLimiter);
// app.use("/api/patient-auth/verify-otp", authLimiter);
// app.use("/api/booking/initiate", authLimiter);
// app.use("/api/booking/confirm", authLimiter);

// // Request timeout (30 seconds)
// app.use((req, res, next) => {
//   req.setTimeout(30000, () => {
//     res.status(408).json({
//       success: false,
//       error: {
//         code: "REQUEST_TIMEOUT",
//         message: "Request timeout",
//       },
//     });
//   });
//   next();
// });

// // Mount API routes
// app.use("/api", routes);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     error: {
//       code: "NOT_FOUND",
//       message: "Route not found",
//     },
//   });
// });

// // Error handling middleware (must be last)
// app.use(errorMiddleware);

// export default app;
