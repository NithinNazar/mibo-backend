// src/routes/patient-auth.routes.ts
import { Router } from "express";
import { patientAuthController } from "../controllers/patient-auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * POST /api/patient-auth/send-otp
 * Send OTP to patient's phone via WhatsApp
 * Public endpoint
 */
router.post(
  "/send-otp",
  patientAuthController.sendOtp.bind(patientAuthController)
);

/**
 * POST /api/patient-auth/verify-otp
 * Verify OTP and login/signup patient
 * Public endpoint
 */
router.post(
  "/verify-otp",
  patientAuthController.verifyOtp.bind(patientAuthController)
);

/**
 * POST /api/patient-auth/refresh-token
 * Refresh access token
 * Public endpoint
 */
router.post(
  "/refresh-token",
  patientAuthController.refreshToken.bind(patientAuthController)
);

/**
 * POST /api/patient-auth/logout
 * Logout patient
 * Public endpoint (but requires refresh token in body)
 */
router.post(
  "/logout",
  patientAuthController.logout.bind(patientAuthController)
);

/**
 * GET /api/patient-auth/me
 * Get current patient profile
 * Protected endpoint
 */
router.get(
  "/me",
  authMiddleware,
  patientAuthController.getCurrentPatient.bind(patientAuthController)
);

export default router;
