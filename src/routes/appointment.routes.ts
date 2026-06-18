// src/routes/appointment.routes.ts
import { Router } from "express";
import { appointmentController } from "../controllers/appointment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  requireRole,
  enforceClinicianScope,
} from "../middlewares/role.middleware";

const router = Router();

/**
 * GET /api/appointments/my-appointments
 * Get current clinician's appointments (current, upcoming, past)
 * Role: CLINICIAN only
 */
router.get(
  "/my-appointments",
  authMiddleware,
  requireRole("CLINICIAN"),
  (req, res, next) => appointmentController.getMyAppointments(req, res, next),
);

/**
 * GET /api/appointments/dashboard/stats
 * Get clinician dashboard statistics
 * Role: CLINICIAN only
 */
router.get(
  "/dashboard/stats",
  authMiddleware,
  requireRole("CLINICIAN"),
  (req, res, next) =>
    appointmentController.getClinicianDashboardStats(req, res, next),
);

/**
 * GET /api/appointments/dashboard/appointments
 * Get clinician's appointments for dashboard with filters
 * Role: CLINICIAN only
 */
router.get(
  "/dashboard/appointments",
  authMiddleware,
  requireRole("CLINICIAN"),
  (req, res, next) =>
    appointmentController.getClinicianDashboardAppointments(req, res, next),
);

/**
 * POST /api/appointments/:id/start-session
 * Start a session - marks appointment as IN_PROGRESS
 * Role: CLINICIAN only
 */
router.post(
  "/:id/start-session",
  authMiddleware,
  requireRole("CLINICIAN"),
  (req, res, next) => appointmentController.startSession(req, res, next),
);

/**
 * POST /api/appointments/:id/end-session
 * End a session - marks appointment as COMPLETED
 * Role: CLINICIAN only
 */
router.post(
  "/:id/end-session",
  authMiddleware,
  requireRole("CLINICIAN"),
  (req, res, next) => appointmentController.endSession(req, res, next),
);

/**
 * POST /api/appointments/:id/clinician-notes
 * Save clinician notes for a session
 * Role: CLINICIAN only
 */
router.post(
  "/:id/clinician-notes",
  authMiddleware,
  requireRole("CLINICIAN"),
  (req, res, next) => appointmentController.saveClinicianNotes(req, res, next),
);

/**
 * GET /api/appointments/:id/previous-notes
 * Get previous session notes for the patient
 * Role: CLINICIAN only
 */
router.get(
  "/:id/previous-notes",
  authMiddleware,
  requireRole("CLINICIAN"),
  (req, res, next) =>
    appointmentController.getPreviousSessionNotes(req, res, next),
);

/**
 * POST /api/appointments/:id/schedule-followup
 * Schedule a follow-up appointment
 * Role: CLINICIAN only
 */
router.post(
  "/:id/schedule-followup",
  authMiddleware,
  requireRole("CLINICIAN"),
  (req, res, next) => appointmentController.scheduleFollowUp(req, res, next),
);

/**
 * POST /api/appointments/:id/send-payment-link
 * Send Razorpay payment link to patient via WhatsApp
 * Roles: ADMIN, MANAGER, FRONT_DESK, CARE_COORDINATOR
 */
router.post(
  "/:id/send-payment-link",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "FRONT_DESK", "CARE_COORDINATOR"),
  (req, res, next) => appointmentController.sendPaymentLink(req, res, next),
);

/**
 * POST /api/appointments/:id/confirm-direct-payment
 * Confirm direct payment (CASH/CARD/UPI) made at front desk
 * Roles: ADMIN, MANAGER, FRONT_DESK, CARE_COORDINATOR
 */
router.post(
  "/:id/confirm-direct-payment",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "FRONT_DESK", "CARE_COORDINATOR"),
  (req, res, next) =>
    appointmentController.confirmDirectPayment(req, res, next),
);

/**
 * GET /api/appointments
 * Get appointments with query filters (centreId, clinicianId, patientId, date, status)
 * Role-based filtering applied automatically
 * Clinicians can only access their own appointments
 */
router.get("/", authMiddleware, enforceClinicianScope(), (req, res, next) =>
  appointmentController.getAppointments(req, res, next),
);

/**
 * GET /api/appointments/availability
 * Get clinician availability for a specific date
 * Query params: clinician_id, centre_id, date (YYYY-MM-DD)
 */
router.get("/availability", authMiddleware, (req, res, next) =>
  appointmentController.getClinicianAvailability(req, res, next),
);

/**
 * GET /api/appointments/:id
 * Get appointment by ID with access control
 * Access control is handled in the controller
 */
router.get("/:id", authMiddleware, (req, res, next) =>
  appointmentController.getAppointmentByIdWithDetails(req, res, next),
);

/**
 * PATCH /api/appointments/:id/notes
 * Update appointment notes
 * Roles: CLINICIAN, ADMIN, MANAGER
 * Clinicians can only update notes for their own appointments
 * Validates: Requirements 5.5, 5.6
 */
router.patch(
  "/:id/notes",
  authMiddleware,
  enforceClinicianScope(),
  (req, res, next) =>
    appointmentController.updateAppointmentNotes(req, res, next),
);

/**
 * POST /api/appointments
 * Create appointment
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 * If userType = PATIENT, patient is automatically derived
 * If userType = STAFF, body.patient_id must be provided
 */
router.post(
  "/",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ),
  (req, res, next) => appointmentController.createAppointment(req, res, next),
);

/**
 * PUT /api/appointments/:id
 * Update appointment (reschedule or update status)
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, CLINICIAN
 */
router.put(
  "/:id",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "CLINICIAN",
  ),
  (req, res, next) => appointmentController.updateAppointment(req, res, next),
);

/**
 * DELETE /api/appointments/:id
 * Cancel appointment with reason
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ),
  (req, res, next) => appointmentController.cancelAppointment(req, res, next),
);

export default router;
