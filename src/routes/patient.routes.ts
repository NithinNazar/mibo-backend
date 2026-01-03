// src/routes/patient.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { patientController } from "../controllers/patient.controller";

const router = Router();

/**
 * GET /api/patients
 * Get patients with search filters
 * Query params: search (name), phone
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.get(
  "/",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => patientController.getPatients(req, res, next)
);

/**
 * GET /api/patients/:id
 * Get patient by ID with complete details
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK, CLINICIAN
 */
router.get(
  "/:id",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
    "CLINICIAN"
  ),
  (req, res, next) => patientController.getPatientById(req, res, next)
);

/**
 * POST /api/patients
 * Create new patient
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.post(
  "/",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => patientController.createPatient(req, res, next)
);

/**
 * PUT /api/patients/:id
 * Update patient profile
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.put(
  "/:id",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => patientController.updatePatient(req, res, next)
);

/**
 * GET /api/patients/:id/appointments
 * Get patient appointment history
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK, CLINICIAN
 */
router.get(
  "/:id/appointments",
  authMiddleware,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
    "CLINICIAN"
  ),
  (req, res, next) => patientController.getPatientAppointments(req, res, next)
);

/**
 * POST /api/patients/:id/notes
 * Add medical note to patient
 * Roles: CLINICIAN, ADMIN
 */
router.post(
  "/:id/notes",
  authMiddleware,
  requireRole("CLINICIAN", "ADMIN"),
  (req, res, next) => patientController.addMedicalNote(req, res, next)
);

export default router;
