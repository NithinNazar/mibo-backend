// src/middlewares/role.middleware.ts
import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { ApiError } from "../utils/apiError";

/*
 Allows only users with certain roles to access the route.
*/
export function requireRoles(required: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    const userRoles = req.user.roles || [];

    const allowed = required.some((role) => userRoles.includes(role));

    if (!allowed) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }

    return next();
  };
}
