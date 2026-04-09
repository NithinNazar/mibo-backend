// src/routes/slot-blocking.routes.ts
import { Router } from "express";
import { slotBlockingController } from "../controllers/slot-blocking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * POST /api/admin/slots/block
 * Block a single slot
 * Protected endpoint - requires admin authentication
 */
router.post(
  "/block",
  authMiddleware,
  slotBlockingController.blockSlot.bind(slotBlockingController),
);

/**
 * POST /api/admin/slots/block-multiple
 * Block multiple slots at once
 * Protected endpoint - requires admin authentication
 */
router.post(
  "/block-multiple",
  authMiddleware,
  slotBlockingController.blockMultipleSlots.bind(slotBlockingController),
);

/**
 * POST /api/admin/slots/block-day
 * Block all slots for a clinician on a specific day
 * Protected endpoint - requires admin authentication
 */
router.post(
  "/block-day",
  authMiddleware,
  slotBlockingController.blockClinicianDay.bind(slotBlockingController),
);

/**
 * POST /api/admin/slots/unblock/:slotId
 * Unblock a previously blocked slot
 * Protected endpoint - requires admin authentication
 */
router.post(
  "/unblock/:slotId",
  authMiddleware,
  slotBlockingController.unblockSlot.bind(slotBlockingController),
);

/**
 * GET /api/admin/slots/blocked
 * Get blocked slots with filters
 * Protected endpoint - requires admin authentication
 */
router.get(
  "/blocked",
  authMiddleware,
  slotBlockingController.getBlockedSlots.bind(slotBlockingController),
);

/**
 * POST /api/admin/slots/affected-patients
 * Get affected patients (preview before blocking)
 * Protected endpoint - requires admin authentication
 */
router.post(
  "/affected-patients",
  authMiddleware,
  slotBlockingController.getAffectedPatients.bind(slotBlockingController),
);

export default router;
