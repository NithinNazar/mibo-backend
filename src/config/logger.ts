// src/config/logger.ts
import winston from "winston";
import { ENV } from "./env";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: ENV.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "mibo-backend" },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: ENV.NODE_ENV === "development" ? consoleFormat : logFormat,
    }),
  ],
});

// Add file transports for production
if (ENV.NODE_ENV === "production") {
  // Error log file
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 14, // Keep 14 days of logs
    })
  );
}

/**
 * Mask sensitive data in logs
 */
export function maskSensitiveData(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  const masked = { ...data };
  const sensitiveFields = [
    "password",
    "password_hash",
    "otp",
    "otp_hash",
    "token",
    "accessToken",
    "refreshToken",
    "refresh_token",
    "access_token",
    "authorization",
  ];

  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = "***MASKED***";
    }
  }

  // Mask phone numbers (show only last 4 digits)
  if (masked.phone && typeof masked.phone === "string") {
    masked.phone = masked.phone.replace(/(\d{6})(\d{4})/, "******$2");
  }

  // Mask email (show only domain)
  if (masked.email && typeof masked.email === "string") {
    masked.email = masked.email.replace(/(.+)@/, "***@");
  }

  return masked;
}

/**
 * Log with correlation ID for request tracking
 */
export function logWithContext(
  level: string,
  message: string,
  meta?: any
): void {
  const maskedMeta = meta ? maskSensitiveData(meta) : {};
  logger.log(level, message, maskedMeta);
}

export default logger;
