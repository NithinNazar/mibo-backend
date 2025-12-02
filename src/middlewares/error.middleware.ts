// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { logger } from "../config/logger";

export default function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    if (err.status >= 500) {
      logger.error("ApiError:", err.message, err.details);
    }
    return res.status(err.status).json({
      success: false,
      message: err.message,
      details: err.details || null,
    });
  }

  logger.error("Unexpected error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
