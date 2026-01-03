// src/routes/patient-auth.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import { patientAuthController } from "../controllers/patient-auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { body } from "express-validator";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

/**
 * POST /api/patient-auth/send-otp
 * Send OTP to patient's phone via WhatsApp
 * Public endpoint
 */
router.post(
  "/send-otp",
  [
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[+]?[0-9]{10,15}$/)
      .withMessage("Invalid phone number format"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    patientAuthController.sendOtp(req, res, next)
);

/**
 * POST /api/patient-auth/verify-otp
 * Verify OTP and login/signup patient
 * Public endpoint
 */
router.post(
  "/verify-otp",
  [
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[+]?[0-9]{10,15}$/)
      .withMessage("Invalid phone number format"),
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must be numeric"),
    body("full_name")
      .optional()
      .isString()
      .withMessage("Full name must be a string")
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    patientAuthController.verifyOtp(req, res, next)
);

/**
 * POST /api/patient-auth/refresh
 * Refresh access token
 * Public endpoint
 */
router.post(
  "/refresh",
  [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    patientAuthController.refreshToken(req, res, next)
);

/**
 * POST /api/patient-auth/logout
 * Logout patient
 * Protected endpoint
 */
router.post(
  "/logout",
  authenticate,
  [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    patientAuthController.logout(req, res, next)
);

/**
 * GET /api/patient-auth/me
 * Get current patient profile
 * Protected endpoint
 */
router.get("/me", authenticate, (req, res, next) =>
  patientAuthController.getCurrentPatient(req, res, next)
);

export default router;
