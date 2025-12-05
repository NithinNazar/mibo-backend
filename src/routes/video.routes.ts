// src/routes/video.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { videoController } from "../controllers/video.controller";

const router = Router();

/**
 * POST /api/video/generate-meet-link
 * Generate Google Meet link for appointment
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.post(
  "/generate-meet-link",
  authenticate,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => videoController.generateMeetLink(req, res, next)
);

/**
 * GET /api/video/appointment/:id/meet-link
 * Get Meet link for appointment
 * Authentication: Required
 */
router.get("/appointment/:id/meet-link", authenticate, (req, res, next) =>
  videoController.getMeetLinkForAppointment(req, res, next)
);

/**
 * PUT /api/video/appointment/:id/meet-link
 * Update Meet link for appointment
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.put(
  "/appointment/:id/meet-link",
  authenticate,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => videoController.updateMeetLink(req, res, next)
);

/**
 * DELETE /api/video/appointment/:id/meet-link
 * Delete Meet link for appointment
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 */
router.delete(
  "/appointment/:id/meet-link",
  authenticate,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => videoController.deleteMeetLink(req, res, next)
);

/**
 * GET /api/video/links
 * Get all video links with filters
 * Query params: startDate, endDate, provider
 * Roles: ADMIN, MANAGER
 */
router.get(
  "/links",
  authenticate,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) => videoController.getAllVideoLinks(req, res, next)
);

export default router;
