// src/routes/patient-dashboard.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import { patientDashboardController } from "../controllers/patient-dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { body } from "express-validator";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/patient/dashboard
 * Get patient dashboard with overview
 */
router.get("/dashboard", (req, res, next) =>
  patientDashboardController.getDashboard(req, res, next)
);

/**
 * GET /api/patient/appointments
 * Get all patient appointments
 */
router.get("/appointments", (req, res, next) =>
  patientDashboardController.getAppointments(req, res, next)
);

/**
 * GET /api/patient/payments
 * Get all patient payments
 */
router.get("/payments", (req, res, next) =>
  patientDashboardController.getPayments(req, res, next)
);

/**
 * GET /api/patient/profile
 * Get patient profile
 */
router.get("/profile", (req, res, next) =>
  patientDashboardController.getProfile(req, res, next)
);

/**
 * PUT /api/patient/profile
 * Update patient profile
 */
router.put(
  "/profile",
  [
    body("full_name")
      .optional()
      .isString()
      .withMessage("Full name must be a string")
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("date_of_birth")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),
    body("gender")
      .optional()
      .isIn(["MALE", "FEMALE", "OTHER"])
      .withMessage("Gender must be MALE, FEMALE, or OTHER"),
    body("blood_group")
      .optional()
      .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .withMessage("Invalid blood group"),
    body("emergency_contact_name")
      .optional()
      .isString()
      .withMessage("Emergency contact name must be a string"),
    body("emergency_contact_phone")
      .optional()
      .matches(/^[+]?[0-9]{10,15}$/)
      .withMessage("Invalid emergency contact phone format"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    patientDashboardController.updateProfile(req, res, next)
);

/**
 * POST /api/patient/appointments/:id/cancel
 * Request appointment cancellation
 */
router.post(
  "/appointments/:id/cancel",
  [
    body("reason")
      .notEmpty()
      .withMessage("Cancellation reason is required")
      .isString()
      .withMessage("Reason must be a string")
      .isLength({ min: 5, max: 500 })
      .withMessage("Reason must be between 5 and 500 characters"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    patientDashboardController.cancelAppointment(req, res, next)
);

export default router;
