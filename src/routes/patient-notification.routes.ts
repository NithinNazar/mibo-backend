// src/routes/patient-notification.routes.ts
import { Router } from "express";
import { patientNotificationController } from "../controllers/patient-notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * GET /api/patient/notifications/unread-count
 * Get unread notification count
 * Protected endpoint - requires patient authentication
 * MUST be before /:notificationId route
 */
router.get(
  "/unread-count",
  authMiddleware,
  patientNotificationController.getUnreadCount.bind(
    patientNotificationController,
  ),
);

/**
 * GET /api/patient/notifications
 * Get patient notifications with filters
 * Protected endpoint - requires patient authentication
 */
router.get(
  "/",
  authMiddleware,
  patientNotificationController.getNotifications.bind(
    patientNotificationController,
  ),
);

/**
 * PUT /api/patient/notifications/:notificationId/read
 * Mark notification as read
 * Protected endpoint - requires patient authentication
 */
router.put(
  "/:notificationId/read",
  authMiddleware,
  patientNotificationController.markAsRead.bind(patientNotificationController),
);

export default router;
