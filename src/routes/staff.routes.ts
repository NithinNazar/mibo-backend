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
  staffController.getStaffUsers(req, res, next),
);

/**
 * GET /api/users/:id
 * Get staff user by ID
 * Roles: ADMIN only
 */
router.get("/:id", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.getStaffById(req, res, next),
);

/**
 * POST /api/users
 * Create staff user
 * Roles: ADMIN only
 */
router.post("/", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.createStaffUser(req, res, next),
);

/**
 * PUT /api/users/:id
 * Update staff user
 * Roles: ADMIN only
 */
router.put("/:id", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.updateStaffUser(req, res, next),
);

/**
 * DELETE /api/users/:id
 * Delete staff user (soft delete)
 * Roles: ADMIN only
 */
router.delete("/:id", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.deleteStaffUser(req, res, next),
);

/**
 * PATCH /api/users/:id/toggle-active
 * Toggle staff active status (for all staff types)
 * Roles: ADMIN, MANAGER
 */
router.patch(
  "/:id/toggle-active",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) => staffController.toggleStaffActive(req, res, next),
);

/**
 * GET /api/clinicians
 * Get clinicians with filters
 * Query params: centreId, specialization
 * Roles: All authenticated users
 */
router.get("/clinicians", authMiddleware, (req, res, next) =>
  staffController.getClinicians(req, res, next),
);

/**
 * GET /api/clinicians/:id
 * Get clinician by ID
 * Roles: All authenticated users
 */
router.get("/clinicians/:id", authMiddleware, (req, res, next) =>
  staffController.getClinicianById(req, res, next),
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
  (req, res, next) => staffController.createClinician(req, res, next),
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
  (req, res, next) => staffController.updateClinician(req, res, next),
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
  (req, res, next) => staffController.deleteClinician(req, res, next),
);

/**
 * PATCH /api/clinicians/:id/toggle-active
 * Toggle clinician active status
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.patch(
  "/clinicians/:id/toggle-active",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.toggleClinicianActive(req, res, next),
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
    staffController.updateClinicianAvailability(req, res, next),
);

/**
 * GET /api/clinicians/:id/availability
 * Get clinician availability rules
 * Roles: All authenticated users
 */
router.get("/clinicians/:id/availability", authMiddleware, (req, res, next) =>
  staffController.getClinicianAvailability(req, res, next),
);

/**
 * POST /api/users/managers
 * Create manager staff
 * Roles: ADMIN only
 */
router.post(
  "/managers",
  authMiddleware,
  requireRole("ADMIN"),
  (req, res, next) => staffController.createManager(req, res, next),
);

/**
 * POST /api/users/centre-managers
 * Create centre manager staff
 * Roles: ADMIN only
 */
router.post(
  "/centre-managers",
  authMiddleware,
  requireRole("ADMIN"),
  (req, res, next) => staffController.createCentreManager(req, res, next),
);

/**
 * POST /api/users/care-coordinators
 * Create care coordinator staff
 * Roles: ADMIN only
 */
router.post(
  "/care-coordinators",
  authMiddleware,
  requireRole("ADMIN"),
  (req, res, next) => staffController.createCareCoordinator(req, res, next),
);

/**
 * POST /api/users/front-desk
 * Create front desk staff
 * Roles: ADMIN, MANAGER
 */
router.post(
  "/front-desk",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) => staffController.createFrontDeskStaff(req, res, next),
);

export default router;
