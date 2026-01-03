// src/controllers/patient-auth.controller.ts
import { Request, Response } from "express";
import { patientAuthService } from "../services/patient-auth.service";
import logger from "../config/logger";

class PatientAuthController {
  /**
   * Send OTP for patient login/signup
   * POST /api/patient-auth/send-otp
   */
  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;

      if (!phone) {
        res.status(400).json({
          success: false,
          message: "Phone number is required",
        });
        return;
      }

      // Validate phone format (Indian mobile: 10 digits starting with 6-9)
      const phoneRegex = /^91[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        res.status(400).json({
          success: false,
          message: "Invalid phone number format. Use format: 919876543210",
        });
        return;
      }

      await patientAuthService.sendOTP(phone);

      res.json({
        success: true,
        message: "OTP sent successfully to your WhatsApp",
        data: {
          phone,
          expiresIn: "10 minutes",
        },
      });
    } catch (error: any) {
      logger.error("Error sending OTP:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to send OTP",
      });
    }
  }

  /**
   * Verify OTP and login/signup patient
   * POST /api/patient-auth/verify-otp
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, otp, full_name, email } = req.body;

      if (!phone || !otp) {
        res.status(400).json({
          success: false,
          message: "Phone and OTP are required",
        });
        return;
      }

      const result = await patientAuthService.verifyOTPAndLogin(
        phone,
        otp,
        full_name,
        email
      );

      res.json({
        success: true,
        message: result.isNewUser
          ? "Account created successfully! Welcome to Mibo."
          : "Login successful! Welcome back.",
        data: {
          user: result.user,
          patient: result.patient,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          isNewUser: result.isNewUser,
        },
      });
    } catch (error: any) {
      logger.error("Error verifying OTP:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Invalid OTP",
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/patient-auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
        return;
      }

      const result = await patientAuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      logger.error("Error refreshing token:", error);
      res.status(401).json({
        success: false,
        message: error.message || "Invalid refresh token",
      });
    }
  }

  /**
   * Logout patient
   * POST /api/patient-auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await patientAuthService.logout(refreshToken);
      }

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      logger.error("Error logging out:", error);
      // Always return success for logout
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    }
  }

  /**
   * Get current patient profile
   * GET /api/patient-auth/me
   */
  async getCurrentPatient(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const profile = await patientAuthService.getPatientProfile(
        req.user.userId
      );

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error("Error getting patient profile:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get profile",
      });
    }
  }
}

export const patientAuthController = new PatientAuthController();
