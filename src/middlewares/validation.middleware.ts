// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

/**
 * Validation middleware to check express-validator results
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: errors.array().map((err: any) => ({
          field: err.type === "field" ? err.path : undefined,
          message: err.msg,
        })),
      },
    });
  }

  next();
};
