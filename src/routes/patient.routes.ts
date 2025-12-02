// src/routes/patient.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";
import { patientController } from "../controllers/patient.controller";

const router = Router();

/*
 Logged-in patient fetches their own profile
*/
router.get("/me", authenticate, (req, res, next) =>
  patientController.getMyProfile(req, res, next)
);

/*
 Logged-in patient updates their profile
*/
router.put("/me", authenticate, (req, res, next) =>
  patientController.updateMyProfile(req, res, next)
);

/*
 Admin or staff roles fetch patient by ID
*/
router.get(
  "/:id",
  authenticate,
  requireRoles([
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ]),
  (req, res, next) => patientController.getPatientById(req, res, next)
);

/*
 Front desk or admin creates a new patient manually
*/
router.post(
  "/",
  authenticate,
  requireRoles(["ADMIN", "FRONT_DESK"]),
  (req, res, next) => patientController.createPatient(req, res, next)
);

export default router;
