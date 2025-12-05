// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ApiError, handleDatabaseError } from "../utils/apiError";
import logger, { maskSensitiveData } from "../config/logger";
import { ENV } from "../config/env";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

export default function errorMiddleware(
  err: Error | ApiError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error with context
  const errorContext = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: maskSensitiveData(req.body),
    query: req.query,
    params: req.params,
    userId: (req as any).user?.userId,
  };

  // Handle ApiError instances
  if (err instanceof ApiError) {
    // Log server errors
    if (err.statusCode >= 500) {
      logger.error("API Error:", errorContext);
    } else if (err.statusCode >= 400) {
      logger.warn("Client Error:", errorContext);
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        stack: ENV.NODE_ENV === "development" ? err.stack : undefined,
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle database errors
  if (err.code && typeof err.code === "string") {
    const dbError = handleDatabaseError(err);
    logger.error("Database Error:", { ...errorContext, dbCode: err.code });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: dbError.code,
        message: dbError.message,
        stack: ENV.NODE_ENV === "development" ? err.stack : undefined,
      },
    };

    res.status(dbError.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  logger.error("Unexpected Error:", errorContext);

  const response: ErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        ENV.NODE_ENV === "development"
          ? err.message || "An unexpected error occurred"
          : "An unexpected error occurred",
      stack: ENV.NODE_ENV === "development" ? err.stack : undefined,
    },
  };

  res.status(500).json(response);
}
