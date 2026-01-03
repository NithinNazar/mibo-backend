// src/routes/notification.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { notificationController } from "../controllers/notification.controller";

const router = Router();

/**
 * POST /api/notifications/appointment-confirmation
 * Send appointment confirmation notification
 * System use - typically called after appointment creation
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.post(
  "/appointment-confirmation",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) =>
    notificationController.sendAppointmentConfirmation(req, res, next)
);

/**
 * POST /api/notifications/appointment-reminder
 * Send appointment reminder notification
 * System use - typically called by scheduled job
 * Roles: ADMIN, MANAGER
 */
router.post(
  "/appointment-reminder",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) =>
    notificationController.sendAppointmentReminder(req, res, next)
);

/**
 * GET /api/notifications/history
 * Get notification history with filters
 * Query params: patientId, appointmentId, notificationType, status, startDate, endDate, limit
 * Roles: ADMIN, MANAGER
 */
router.get(
  "/history",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) =>
    notificationController.getNotificationHistory(req, res, next)
);

/**
 * GET /api/notifications/stats
 * Get notification statistics
 * Query params: startDate, endDate
 * Roles: ADMIN, MANAGER
 */
router.get(
  "/stats",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) =>
    notificationController.getNotificationStats(req, res, next)
);

/**
 * GET /api/notifications/:id
 * Get notification by ID
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.get(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => notificationController.getNotificationById(req, res, next)
);

export default router;
