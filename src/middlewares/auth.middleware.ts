// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { patientAuthService } from "../services/patient-auth.service";
import { JwtPayload } from "../utils/jwt";
import logger from "../config/logger";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware to verify JWT access token
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const payload = patientAuthService.verifyAccessToken(token);

    // Attach user info to request
    req.user = payload;

    next();
  } catch (error: any) {
    logger.error("Auth middleware error:", error);

    if (error.message.includes("expired")) {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please refresh your token.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token. Please login again.",
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const payload = patientAuthService.verifyAccessToken(token);

      req.user = payload;
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};
