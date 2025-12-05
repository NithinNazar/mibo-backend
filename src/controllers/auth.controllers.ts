// src/controllers/auth.controllers.ts
import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.services";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export class AuthController {
  /**
   * POST /api/auth/send-otp
   * Body: { phone: string }
   */
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      const result = await authService.sendOtp(phone);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login/phone-otp
   * Body: { phone: string, otp: string }
   */
  async loginWithPhoneOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, otp } = req.body;
      const result = await authService.loginWithPhoneOtp(phone, otp);
      return ok(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login/phone-password
   * Body: { phone: string, password: string }
   */
  async loginWithPhonePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { phone, password } = req.body;
      const result = await authService.loginWithPhonePassword(phone, password);
      return ok(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login/username-password
   * Body: { username: string, password: string }
   */
  async loginWithUsernamePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { username, password } = req.body;
      const result = await authService.loginWithUsernamePassword(
        username,
        password
      );
      return ok(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/refresh
   * Body: { refreshToken: string }
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/logout
   * Headers: Authorization: Bearer {accessToken}
   * Body: { refreshToken: string }
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user!.userId;
      await authService.logout(userId, refreshToken);
      return ok(res, { message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/auth/me
   * Headers: Authorization: Bearer {accessToken}
   */
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getCurrentUser(userId);
      return ok(res, { user });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
