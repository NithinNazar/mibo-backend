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
  bookingController.createAppointment.bind(bookingController),
);

/**
 * GET /api/booking/available-slots
 * Get available time slots for a clinician
 * Public endpoint - MUST be before /:id route
 */
router.get(
  "/available-slots",
  bookingController.getAvailableSlots.bind(bookingController),
);

/**
 * GET /api/booking/my-appointments
 * Get all appointments for logged-in patient
 * Protected endpoint - requires authentication
 */
router.get(
  "/my-appointments",
  authMiddleware,
  bookingController.getMyAppointments.bind(bookingController),
);

/**
 * GET /api/booking/:id
 * Get appointment details
 * Protected endpoint - requires authentication
 */
router.get(
  "/:id",
  authMiddleware,
  bookingController.getAppointment.bind(bookingController),
);

/**
 * POST /api/booking/:id/cancel
 * Cancel appointment
 * Protected endpoint - requires authentication
 */
router.post(
  "/:id/cancel",
  authMiddleware,
  bookingController.cancelAppointment.bind(bookingController),
);

/**
 * POST /api/booking/front-desk
 * Book appointment for patient (Front Desk staff)
 * Protected endpoint - requires FRONT_DESK, ADMIN, or MANAGER role
 */
router.post(
  "/front-desk",
  authMiddleware,
  bookingController.bookForPatient.bind(bookingController),
);

export default router;
