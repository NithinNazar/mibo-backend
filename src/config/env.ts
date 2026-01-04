// src/config/env.ts
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: "development" | "staging" | "production";

  DATABASE_URL: string;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;

  OTP_EXPIRY_MINUTES: number;

  GALLABOX_BASE_URL: string;
  GALLABOX_API_KEY: string;
  GALLABOX_API_SECRET: string;
  GALLABOX_CHANNEL_ID: string;

  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;

  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_CALENDAR_ID: string;

  CORS_ORIGIN: string;
}

function validateEnv(): EnvironmentConfig {
  const requiredVars = [
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
  ];

  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missingVars.join(", ")}`
    );
    process.exit(1);
  }

  return {
    // Server
    PORT: process.env.PORT ? Number(process.env.PORT) : 5000,
    NODE_ENV:
      (process.env.NODE_ENV as "development" | "staging" | "production") ||
      "development",

    // Database
    DATABASE_URL: process.env.DATABASE_URL!,

    // JWT
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET!,
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

    // OTP
    OTP_EXPIRY_MINUTES: Number(process.env.OTP_EXPIRY_MINUTES || 10),

    // Gallabox
    GALLABOX_BASE_URL:
      process.env.GALLABOX_BASE_URL || "https://server.gallabox.com/api/v1",
    GALLABOX_API_KEY: process.env.GALLABOX_API_KEY || "",
    GALLABOX_API_SECRET: process.env.GALLABOX_API_SECRET || "",
    GALLABOX_CHANNEL_ID: process.env.GALLABOX_CHANNEL_ID || "",

    // Razorpay
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",

    // Google Meet (Render-safe)
    GOOGLE_SERVICE_ACCOUNT_EMAIL:
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID || "primary",

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  };
}

export const ENV = validateEnv();

if (ENV.NODE_ENV === "development") {
  console.log("🔧 Environment Configuration:");
  console.log(`   NODE_ENV: ${ENV.NODE_ENV}`);
  console.log(`   PORT: ${ENV.PORT}`);
  console.log(`   CORS_ORIGIN: ${ENV.CORS_ORIGIN}`);
}

// // src/config/env.ts
// import dotenv from "dotenv";

// // Load environment variables from .env file
// dotenv.config();

// interface EnvironmentConfig {
//   // Server Configuration
//   PORT: number;
//   NODE_ENV: "development" | "staging" | "production";

//   // Database Configuration
//   DATABASE_URL: string;

//   // JWT Configuration
//   JWT_ACCESS_SECRET: string;
//   JWT_REFRESH_SECRET: string;
//   JWT_ACCESS_EXPIRY: string;
//   JWT_REFRESH_EXPIRY: string;

//   // OTP Configuration
//   OTP_EXPIRY_MINUTES: number;

//   // Gallabox (WhatsApp) Configuration
//   GALLABOX_BASE_URL: string;
//   GALLABOX_API_KEY: string;
//   GALLABOX_API_SECRET: string;
//   GALLABOX_CHANNEL_ID: string;

//   // Razorpay Configuration
//   RAZORPAY_KEY_ID: string;
//   RAZORPAY_KEY_SECRET: string;

//   // Google Meet Configuration
//   GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
//   GOOGLE_PRIVATE_KEY: string;
//   GOOGLE_CALENDAR_ID: string;

//   // CORS Configuration
//   CORS_ORIGIN: string;
// }

// function validateEnv(): EnvironmentConfig {
//   const requiredVars = [
//     "DATABASE_URL",
//     "JWT_ACCESS_SECRET",
//     "JWT_REFRESH_SECRET",
//   ];

//   const missingVars = requiredVars.filter((varName) => !process.env[varName]);

//   if (missingVars.length > 0) {
//     console.error(
//       `❌ Missing required environment variables: ${missingVars.join(", ")}`
//     );
//     console.error(
//       "Please check your .env file and ensure all required variables are set."
//     );
//     process.exit(1);
//   }

//   return {
//     // Server Configuration
//     PORT: parseInt(process.env.PORT || "5000", 10),
//     NODE_ENV:
//       (process.env.NODE_ENV as "development" | "staging" | "production") ||
//       "development",

//     // Database Configuration
//     DATABASE_URL: process.env.DATABASE_URL!,

//     // JWT Configuration
//     JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
//     JWT_REFRESH_SECRET:
//       process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET!,
//     JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
//     JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

//     // OTP Configuration
//     OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10),

//     // Gallabox (WhatsApp) Configuration
//     GALLABOX_BASE_URL:
//       process.env.GALLABOX_BASE_URL || "https://server.gallabox.com/api/v1",
//     GALLABOX_API_KEY: process.env.GALLABOX_API_KEY || "",
//     GALLABOX_API_SECRET: process.env.GALLABOX_API_SECRET || "",
//     GALLABOX_CHANNEL_ID: process.env.GALLABOX_CHANNEL_ID || "",

//     // Razorpay Configuration
//     RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
//     RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",

//     // Google Meet Configuration
//     GOOGLE_SERVICE_ACCOUNT_EMAIL:
//       process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
//     GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY || "",
//     GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID || "primary",

//     // CORS Configuration
//     CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
//   };
// }

// // Validate and export environment configuration
// export const ENV = validateEnv();

// // Log startup configuration (non-sensitive values only)
// if (ENV.NODE_ENV === "development") {
//   console.log("🔧 Environment Configuration:");
//   console.log(`   NODE_ENV: ${ENV.NODE_ENV}`);
//   console.log(`   PORT: ${ENV.PORT}`);
//   console.log(
//     `   DATABASE_URL: ${ENV.DATABASE_URL.split("@")[1] || "[configured]"}`
//   );
//   console.log(`   JWT_ACCESS_EXPIRY: ${ENV.JWT_ACCESS_EXPIRY}`);
//   console.log(`   JWT_REFRESH_EXPIRY: ${ENV.JWT_REFRESH_EXPIRY}`);
//   console.log(`   OTP_EXPIRY_MINUTES: ${ENV.OTP_EXPIRY_MINUTES}`);
//   console.log(`   CORS_ORIGIN: ${ENV.CORS_ORIGIN}`);
//   console.log(
//     `   GALLABOX: ${ENV.GALLABOX_API_KEY ? "✓ Configured" : "✗ Not configured"}`
//   );
//   console.log(
//     `   RAZORPAY: ${ENV.RAZORPAY_KEY_ID ? "✓ Configured" : "✗ Not configured"}`
//   );
//   console.log(
//     `   GOOGLE_MEET: ${
//       ENV.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "✓ Configured" : "✗ Not configured"
//     }`
//   );
// }
