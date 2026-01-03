// src/controllers/patient-auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { patientAuthService } from "../services/patient-auth.service";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PatientAuthController {
  /**
   * POST /api/patient-auth/send-otp
   * Body: { phone: string }
   */
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      const result = await patientAuthService.sendOtp(phone);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/patient-auth/verify-otp
   * Body: { phone: string, otp: string, full_name?: string, email?: string }
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, otp, full_name, email } = req.body;
      const result = await patientAuthService.verifyOtpAndAuthenticate(
        phone,
        otp,
        full_name,
        email
      );
      return ok(res, result, "Authentication successful");
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/patient-auth/refresh
   * Body: { refreshToken: string }
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await patientAuthService.refreshAccessToken(refreshToken);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/patient-auth/logout
   * Headers: Authorization: Bearer {accessToken}
   * Body: { refreshToken: string }
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user!.userId;
      await patientAuthService.logout(userId, refreshToken);
      return ok(res, { message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/patient-auth/me
   * Headers: Authorization: Bearer {accessToken}
   */
  async getCurrentPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const patient = await patientAuthService.getCurrentPatient(userId);
      return ok(res, patient);
    } catch (err) {
      next(err);
    }
  }
}

export const patientAuthController = new PatientAuthController();
