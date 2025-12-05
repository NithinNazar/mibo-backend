// src/routes/appointment.routes.ts
import { Router } from "express";
import { appointmentController } from "../controllers/appointment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

/**
 * GET /api/appointments
 * Get appointments with query filters (centreId, clinicianId, patientId, date, status)
 * Role-based filtering applied automatically
 */
router.get("/", authenticate, (req, res, next) =>
  appointmentController.getAppointments(req, res, next)
);

/**
 * GET /api/appointments/availability
 * Get clinician availability for a specific date
 * Query params: clinician_id, centre_id, date (YYYY-MM-DD)
 */
router.get("/availability", authenticate, (req, res, next) =>
  appointmentController.getClinicianAvailability(req, res, next)
);

/**
 * GET /api/appointments/:id
 * Get appointment by ID with access control
 */
router.get("/:id", authenticate, (req, res, next) =>
  appointmentController.getAppointmentById(req, res, next)
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
  authenticate,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => appointmentController.createAppointment(req, res, next)
);

/**
 * PUT /api/appointments/:id
 * Update appointment (reschedule or update status)
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR
 */
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER", "CARE_COORDINATOR"),
  (req, res, next) => appointmentController.updateAppointment(req, res, next)
);

/**
 * DELETE /api/appointments/:id
 * Cancel appointment with reason
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.delete(
  "/:id",
  authenticate,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => appointmentController.cancelAppointment(req, res, next)
);

export default router;
