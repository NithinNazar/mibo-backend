// src/routes/video.routes.ts
import { Router } from "express";
import { videoController } from "../controllers/video.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";

const router = Router();

/*
 Staff can ensure a meet link for an appointment (creates if missing).
*/
router.post(
  "/appointments/:appointmentId/meet",
  authenticate,
  requireRoles([
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CLINICIAN",
    "CARE_COORDINATOR",
  ]),
  (req, res, next) => videoController.ensureMeet(req, res, next)
);

/*
 Patient or staff can fetch existing meet session info if they have access.
*/
router.get("/appointments/:appointmentId", authenticate, (req, res, next) =>
  videoController.getSession(req, res, next)
);

export default router;
