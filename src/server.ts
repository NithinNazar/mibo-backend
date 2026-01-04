import app from "./app";
import { ENV } from "./config/env";
import { testDatabaseConnection, closeDatabaseConnection } from "./config/db";
import logger from "./config/logger";

// ✅ IMPORTANT: Always respect Render's injected PORT
const PORT = Number(process.env.PORT) || ENV.PORT || 5000;

// Start server
async function startServer() {
  try {
    // Test database connection before starting server
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${ENV.NODE_ENV}`);
      logger.info(`🌐 CORS Origin: ${ENV.CORS_ORIGIN}`);
    });

    // ✅ Recommended for cloud platforms like Render
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info("HTTP server closed");

        // Close database connections
        await closeDatabaseConnection();

        logger.info("Graceful shutdown completed");
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30_000);
    };

    // Handle termination signals (Render uses SIGTERM)
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

// import app from "./app";
// import { ENV } from "./config/env";
// import { testDatabaseConnection, closeDatabaseConnection } from "./config/db";
// import logger from "./config/logger";

// const PORT = ENV.PORT || 5000;

// // Start server
// async function startServer() {
//   try {
//     // Test database connection
//     const dbConnected = await testDatabaseConnection();
//     if (!dbConnected) {
//       logger.error("Failed to connect to database. Exiting...");
//       process.exit(1);
//     }

//     // Start HTTP server
//     const server = app.listen(PORT, () => {
//       logger.info(`🚀 Server running on port ${PORT}`);
//       logger.info(`📝 Environment: ${ENV.NODE_ENV}`);
//       logger.info(`🌐 CORS Origin: ${ENV.CORS_ORIGIN}`);
//     });

//     // Graceful shutdown handlers
//     const gracefulShutdown = async (signal: string) => {
//       logger.info(`${signal} received. Starting graceful shutdown...`);

//       // Stop accepting new connections
//       server.close(async () => {
//         logger.info("HTTP server closed");

//         // Close database connections
//         await closeDatabaseConnection();

//         logger.info("Graceful shutdown completed");
//         process.exit(0);
//       });

//       // Force shutdown after 30 seconds
//       setTimeout(() => {
//         logger.error("Forced shutdown after timeout");
//         process.exit(1);
//       }, 30000);
//     };

//     // Listen for termination signals
//     process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
//     process.on("SIGINT", () => gracefulShutdown("SIGINT"));

//     // Handle uncaught exceptions
//     process.on("uncaughtException", (error) => {
//       logger.error("Uncaught Exception:", error);
//       gracefulShutdown("UNCAUGHT_EXCEPTION");
//     });

//     // Handle unhandled promise rejections
//     process.on("unhandledRejection", (reason, promise) => {
//       logger.error("Unhandled Rejection at:", promise, "reason:", reason);
//       gracefulShutdown("UNHANDLED_REJECTION");
//     });
//   } catch (error) {
//     logger.error("Failed to start server:", error);
//     process.exit(1);
//   }
// }

// // Start the server
// startServer();
