// src/routes/staff.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { staffController } from "../controllers/staff.controller";

const router = Router();

/**
 * GET /api/clinicians
 * Get clinicians with filters
 * Query params: centreId, specialization
 * Roles: PUBLIC (no authentication required)
 */
router.get("/clinicians", (req, res, next) =>
  staffController.getClinicians(req, res, next),
);

/**
 * GET /api/clinicians/:id
 * Get clinician by ID
 * Roles: PUBLIC (no authentication required)
 */
router.get("/clinicians/:id", (req, res, next) =>
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
 * Roles: PUBLIC (no authentication required)
 */
router.get("/clinicians/:id/availability", (req, res, next) =>
  staffController.getClinicianAvailability(req, res, next),
);

/**
 * DELETE /api/clinicians/:clinicianId/availability/:ruleId
 * Delete a specific availability rule
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.delete(
  "/clinicians/:clinicianId/availability/:ruleId",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.deleteAvailabilityRule(req, res, next),
);

/**
 * POST /api/clinicians/:clinicianId/availability/delete-by-day
 * Delete all availability rules for a specific day of week
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.post(
  "/clinicians/:clinicianId/availability/delete-by-day",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) =>
    staffController.deleteAvailabilityRulesByDay(req, res, next),
);

/**
 * GET /api/clinicians/:clinicianId/availability/by-day
 * Get availability rules grouped by day of week
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.get(
  "/clinicians/:clinicianId/availability/by-day",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.getAvailabilityRulesByDay(req, res, next),
);

/**
 * POST /api/clinicians/:clinicianId/slot-exceptions
 * Create a slot exception (block a specific slot)
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.post(
  "/clinicians/:clinicianId/slot-exceptions",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.createSlotException(req, res, next),
);

/**
 * GET /api/clinicians/:clinicianId/slot-exceptions
 * Get slot exceptions for a clinician
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), centreId (optional)
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.get(
  "/clinicians/:clinicianId/slot-exceptions",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.getSlotExceptions(req, res, next),
);

/**
 * DELETE /api/clinicians/:clinicianId/slot-exceptions/:exceptionId
 * Delete a slot exception (unblock a specific slot)
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.delete(
  "/clinicians/:clinicianId/slot-exceptions/:exceptionId",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => staffController.deleteSlotException(req, res, next),
);

/**
 * GET /api/clinicians/:id/slots
 * Get clinician time slots for a specific date
 * Query params: date (YYYY-MM-DD), centreId (optional)
 * Roles: PUBLIC (no authentication required)
 */
router.get("/clinicians/:id/slots", (req, res, next) =>
  staffController.getClinicianSlots(req, res, next),
);

/**
 * PATCH /api/clinicians/:id/credentials
 * Update clinician username and password
 * Roles: ADMIN, MANAGER
 * Validates: Requirements 7.1, 7.2, 7.6
 */
router.patch(
  "/:id/credentials",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) =>
    staffController.updateClinicianCredentials(req, res, next),
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
 * POST /api/users
 * Create staff user
 * Roles: ADMIN only
 */
router.post("/", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.createStaffUser(req, res, next),
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
 * GET /api/users/:id
 * Get staff user by ID
 * Roles: ADMIN only
 */
router.get("/:id", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  staffController.getStaffById(req, res, next),
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

export default router;
