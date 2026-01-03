// src/routes/staff.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { staffController } from "../controllers/staff.controller";

const router = Router();

/**
 * GET /api/users
 * Get staff users with filters
 * Query params: roleId, centreId
 * Roles: ADMIN only
 */
router.get("/", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.getStaffUsers(req, res, next)
);

/**
 * GET /api/users/:id
 * Get staff user by ID
 * Roles: ADMIN only
 */
router.get("/:id", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.getStaffById(req, res, next)
);

/**
 * POST /api/users
 * Create staff user
 * Roles: ADMIN only
 */
router.post("/", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.createStaffUser(req, res, next)
);

/**
 * PUT /api/users/:id
 * Update staff user
 * Roles: ADMIN only
 */
router.put("/:id", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.updateStaffUser(req, res, next)
);

/**
 * DELETE /api/users/:id
 * Delete staff user (soft delete)
 * Roles: ADMIN only
 */
router.delete("/:id", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.deleteStaffUser(req, res, next)
);

/**
 * GET /api/clinicians
 * Get clinicians with filters
 * Query params: centreId, specialization
 * Roles: All authenticated users
 */
router.get("/clinicians", authMiddleware, (req, res, next) =>
  staffController.getClinicians(req, res, next)
);

/**
 * GET /api/clinicians/:id
 * Get clinician by ID
 * Roles: All authenticated users
 */
router.get("/clinicians/:id", authMiddleware, (req, res, next) =>
  staffController.getClinicianById(req, res, next)
);

/**
 * POST /api/clinicians
 * Create clinician
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.post(
  "/clinicians",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.createClinician(req, res, next)
);

/**
 * PUT /api/clinicians/:id
 * Update clinician
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.put(
  "/clinicians/:id",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.updateClinician(req, res, next)
);

/**
 * DELETE /api/clinicians/:id
 * Delete clinician (soft delete)
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.delete(
  "/clinicians/:id",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.deleteClinician(req, res, next)
);

/**
 * PUT /api/clinicians/:id/availability
 * Update clinician availability rules
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.put(
  "/clinicians/:id/availability",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) =>
    staffController.updateClinicianAvailability(req, res, next)
);

export default router;
