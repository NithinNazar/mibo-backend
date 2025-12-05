// src/routes/auth.routes.ts
import { Router } from "express";
import { authController } from "../controllers/auth.controllers";
import { authenticate } from "../middlewares/auth.middleware";
import {
  validateSendOtp,
  validateLoginPhoneOtp,
  validateLoginPhonePassword,
  validateLoginUsernamePassword,
  validateRefreshToken,
  validateLogout,
} from "../validations/auth.validations";

const router = Router();

// Send OTP to staff user's phone
router.post("/send-otp", validateSendOtp, (req, res, next) =>
  authController.sendOtp(req, res, next)
);

// Login with phone + OTP
router.post("/login/phone-otp", validateLoginPhoneOtp, (req, res, next) =>
  authController.loginWithPhoneOtp(req, res, next)
);

// Login with phone + password
router.post(
  "/login/phone-password",
  validateLoginPhonePassword,
  (req, res, next) => authController.loginWithPhonePassword(req, res, next)
);

// Login with username + password
router.post(
  "/login/username-password",
  validateLoginUsernamePassword,
  (req, res, next) => authController.loginWithUsernamePassword(req, res, next)
);

// Refresh access token
router.post("/refresh", validateRefreshToken, (req, res, next) =>
  authController.refreshToken(req, res, next)
);

// Logout (protected route)
router.post("/logout", authenticate, validateLogout, (req, res, next) =>
  authController.logout(req, res, next)
);

// Get current user (protected route)
router.get("/me", authenticate, (req, res, next) =>
  authController.getCurrentUser(req, res, next)
);

export default router;
