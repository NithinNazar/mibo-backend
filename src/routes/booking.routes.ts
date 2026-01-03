// src/routes/booking.routes.ts
import { Router } from "express";
import { bookingController } from "../controllers/booking.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * POST /api/booking/create
 * Create new appointment
 * Protected endpoint - requires authentication
 */
router.post(
  "/create",
  authMiddleware,
  bookingController.createAppointment.bind(bookingController)
);

/**
 * GET /api/booking/:id
 * Get appointment details
 * Protected endpoint - requires authentication
 */
router.get(
  "/:id",
  authMiddleware,
  bookingController.getAppointment.bind(bookingController)
);

/**
 * GET /api/booking/my-appointments
 * Get all appointments for logged-in patient
 * Protected endpoint - requires authentication
 */
router.get(
  "/my-appointments",
  authMiddleware,
  bookingController.getMyAppointments.bind(bookingController)
);

/**
 * POST /api/booking/:id/cancel
 * Cancel appointment
 * Protected endpoint - requires authentication
 */
router.post(
  "/:id/cancel",
  authMiddleware,
  bookingController.cancelAppointment.bind(bookingController)
);

/**
 * GET /api/booking/available-slots
 * Get available time slots for a clinician
 * Public endpoint
 */
router.get(
  "/available-slots",
  bookingController.getAvailableSlots.bind(bookingController)
);

export default router;
