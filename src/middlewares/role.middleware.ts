// src/middlewares/role.middleware.ts
import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { ApiError } from "../utils/apiError";
import { db } from "../config/db";

/**
 * Require user to have at least one of the specified roles
 * @param allowedRoles - Array of role names that are allowed
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    const userRoles = req.user.roles || [];

    // Check if user has at least one of the allowed roles
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return next(
        ApiError.forbidden("You do not have permission to access this resource")
      );
    }

    next();
  };
}

/**
 * Require user to have access to a specific centre
 * ADMIN and MANAGER have access to all centres
 * Other roles only have access to their assigned centres
 * @param centreIdParam - Name of the route parameter or query parameter containing centre ID
 */
export function requireCentreAccess(centreIdParam: string = "centreId") {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      const userRoles = req.user.roles || [];

      // ADMIN and MANAGER have access to all centres
      if (userRoles.includes("ADMIN") || userRoles.includes("MANAGER")) {
        return next();
      }

      // Get centre ID from params or query
      const centreId =
        parseInt(req.params[centreIdParam]) ||
        parseInt(req.query[centreIdParam] as string);

      if (!centreId) {
        return next(ApiError.badRequest("Centre ID is required"));
      }

      // Check if user has access to this centre
      const result = await db.oneOrNone(
        `
        SELECT 1
        FROM user_roles
        WHERE user_id = $1
          AND centre_id = $2
          AND is_active = TRUE
        LIMIT 1
      `,
        [req.user.userId, centreId]
      );

      if (!result) {
        return next(
          ApiError.forbidden("You do not have access to this centre")
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require user to have access to specific clinician data
 * CLINICIAN role users can only access their own data
 * ADMIN, MANAGER, CENTRE_MANAGER can access all clinicians
 * @param clinicianIdParam - Name of the route parameter containing clinician ID
 */
export function requireClinicianAccess(
  clinicianIdParam: string = "clinicianId"
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      const userRoles = req.user.roles || [];

      // ADMIN, MANAGER, CENTRE_MANAGER have access to all clinicians
      if (
        userRoles.includes("ADMIN") ||
        userRoles.includes("MANAGER") ||
        userRoles.includes("CENTRE_MANAGER")
      ) {
        return next();
      }

      // CLINICIAN can only access their own data
      if (userRoles.includes("CLINICIAN")) {
        const clinicianId = parseInt(req.params[clinicianIdParam]);

        if (!clinicianId) {
          return next(ApiError.badRequest("Clinician ID is required"));
        }

        // Check if this clinician profile belongs to the current user
        const result = await db.oneOrNone(
          `
          SELECT 1
          FROM clinician_profiles
          WHERE id = $1 AND user_id = $2 AND is_active = TRUE
          LIMIT 1
        `,
          [clinicianId, req.user.userId]
        );

        if (!result) {
          return next(ApiError.forbidden("You can only access your own data"));
        }

        return next();
      }

      // Other roles don't have access to clinician data
      return next(
        ApiError.forbidden("You do not have permission to access this resource")
      );
    } catch (error) {
      next(error);
    }
  };
}

// Legacy alias for backward compatibility
export const requireRoles = requireRole;
