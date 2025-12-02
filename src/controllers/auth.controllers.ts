// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { validatePhone, validateOtp } from "../validations/auth.validation";
import { ok, created } from "../utils/response";

export class AuthController {
  /*
   POST /api/auth/request-otp
   Body: { phone: string }
  */
  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const phone = validatePhone(req.body.phone);
      const result = await authService.requestOtp(phone);
      return created(res, result, "OTP sent if phone is valid");
    } catch (err) {
      next(err);
    }
  }

  /*
   POST /api/auth/verify-otp
   Body: { phone: string, otp: string }
  */
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const phone = validatePhone(req.body.phone);
      const otp = validateOtp(req.body.otp);

      const result = await authService.verifyOtpAndLogin(phone, otp);
      return ok(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
