// src/routes/appointment.routes.ts
import { Router } from "express";
import { appointmentController } from "../controllers/appointment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";

const router = Router();

/*
 Patient or staff creates an appointment.
 If userType = PATIENT, patient is automatically derived.
 If userType = STAFF, body.patient_id must be provided.
*/
router.post("/", authenticate, (req, res, next) =>
  appointmentController.create(req, res, next)
);

/*
 Current patient views all their appointments.
*/
router.get("/me", authenticate, (req, res, next) =>
  appointmentController.listForCurrentPatient(req, res, next)
);

/*
 Staff: list appointments for a clinician.
*/
router.get(
  "/clinician/:clinicianId",
  authenticate,
  requireRoles([
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CLINICIAN",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ]),
  (req, res, next) => appointmentController.listForClinician(req, res, next)
);

/*
 Staff: list appointments for a centre.
*/
router.get(
  "/centre/:centreId",
  authenticate,
  requireRoles([
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ]),
  (req, res, next) => appointmentController.listForCentre(req, res, next)
);

/*
 Get appointment by id, with access control.
*/
router.get("/:id", authenticate, (req, res, next) =>
  appointmentController.getById(req, res, next)
);

/*
 Reschedule appointment.
 Typically staff will use this; you can also allow patients if needed.
*/
router.patch(
  "/:id/reschedule",
  authenticate,
  requireRoles([
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ]),
  (req, res, next) => appointmentController.reschedule(req, res, next)
);

/*
 Update appointment status (cancel, complete, no-show).
 Only staff.
*/
router.patch(
  "/:id/status",
  authenticate,
  requireRoles([
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ]),
  (req, res, next) => appointmentController.updateStatus(req, res, next)
);

export default router;
