// src/routes/auth.routes.ts
import { Router } from "express";
import { authController } from "../controllers/auth.controller";

const router = Router();

// Request OTP for login or signup
router.post("/request-otp", (req, res, next) =>
  authController.requestOtp(req, res, next)
);

// Verify OTP and get JWT
router.post("/verify-otp", (req, res, next) =>
  authController.verifyOtp(req, res, next)
);

export default router;
