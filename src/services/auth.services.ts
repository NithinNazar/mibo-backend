// src/services/auth.services.ts
import { userRepository } from "../repositories/user.repository";
import { authSessionRepository } from "../repositories/authSession.repository";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otp";
import { ApiError } from "../utils/apiError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { verifyPassword } from "../utils/password";
import { ENV } from "../config/env";
import logger from "../config/logger";
import { gallaboxUtil } from "../utils/gallabox";
import { db } from "../config/db";

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    username: string | null;
    role: string;
    avatar: string | null;
    centreIds: string[];
    assignedCentreId?: string; // For FRONT_DESK users
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    clinicianId?: number;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Send OTP to staff user's phone (STAFF users only)
   */
  async sendOtp(phone: string): Promise<{ message: string }> {
    // Check if user exists and is STAFF
    const user = await userRepository.findByPhoneStaffOnly(phone);

    if (!user) {
      // Don't reveal if user exists or not for security
      logger.warn(
        `OTP requested for non-existent or non-staff phone: ${phone}`,
      );
      return { message: "OTP sent if phone is valid" };
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + ENV.OTP_EXPIRY_MINUTES * 60 * 1000);

    await userRepository.createOtpRequest({
      phone,
      otpHash,
      purpose: "LOGIN",
      expiresAt,
    });

    // Send OTP via WhatsApp using Gallabox
    // Gallabox expects phone with country code (12 digits)
    const phoneWithCountryCode = phone.startsWith("91") ? phone : `91${phone}`;

    if (gallaboxUtil.isReady()) {
      try {
        const result = await gallaboxUtil.sendOTP(phoneWithCountryCode, otp);

        if (result.success) {
          logger.info(`✅ OTP sent to ${phoneWithCountryCode} via WhatsApp`);
        } else {
          logger.warn(
            `⚠️ WhatsApp send failed for ${phoneWithCountryCode}, but OTP stored in database`,
          );
        }
      } catch (error) {
        logger.error(
          `Error sending OTP via WhatsApp to ${phoneWithCountryCode}:`,
          error,
        );
        // Continue - OTP is stored in database
      }
    } else {
      logger.warn(
        `⚠️ Gallabox not configured - OTP stored but not sent via WhatsApp`,
      );
    }

    // For development, log OTP
    if (ENV.NODE_ENV === "development") {
      logger.info(`🔐 OTP for ${phone}: ${otp}`);
      console.log(`\n🔐 OTP for ${phone}: ${otp}\n`);
    }

    return { message: "OTP sent successfully" };
  }

  /**
   * Login with phone + OTP (STAFF users only)
   */
  async loginWithPhoneOtp(phone: string, otp: string): Promise<AuthResponse> {
    // Check if user exists (including inactive users)
    const inactiveUser = await db.oneOrNone<{
      id: number;
      is_active: boolean;
    }>(
      "SELECT id, is_active FROM users WHERE phone = $1 AND user_type = 'STAFF'",
      [phone],
    );

    if (!inactiveUser) {
      throw ApiError.forbidden("Access denied");
    }

    // Check if account is inactive
    if (!inactiveUser.is_active) {
      throw ApiError.forbidden("Account inactive");
    }

    // Verify OTP
    const otpRecord = await userRepository.findLatestValidOtp(phone, "LOGIN");

    if (!otpRecord) {
      throw ApiError.badRequest("Invalid or expired OTP");
    }

    const isValid = verifyOtp(otp, otpRecord.otp_hash);

    if (!isValid) {
      await userRepository.incrementOtpAttempts(otpRecord.id);
      throw ApiError.badRequest("Invalid OTP");
    }

    await userRepository.markOtpUsed(otpRecord.id);

    // Generate tokens and return response
    return this.generateAuthResponse(inactiveUser.id);
  }

  /**
   * Login with phone + password (STAFF users only)
   */
  async loginWithPhonePassword(
    phone: string,
    password: string,
  ): Promise<AuthResponse> {
    // Check if user exists (including inactive users)
    const inactiveUser = await db.oneOrNone(
      "SELECT id, is_active, password_hash FROM users WHERE phone = $1 AND user_type = 'STAFF'",
      [phone],
    );

    if (!inactiveUser) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    // Check if account is inactive
    if (!inactiveUser.is_active) {
      throw ApiError.forbidden("Account inactive");
    }

    if (!inactiveUser.password_hash) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    // Verify password
    const isValid = await verifyPassword(password, inactiveUser.password_hash);

    if (!isValid) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    // Generate tokens and return response
    return this.generateAuthResponse(inactiveUser.id);
  }

  /**
   * Login with username + password (STAFF users only)
   */
  async loginWithUsernamePassword(
    username: string,
    password: string,
  ): Promise<AuthResponse> {
    // Check if user exists (including inactive users)
    const inactiveUser = await db.oneOrNone<{
      id: number;
      is_active: boolean;
      password_hash: string | null;
    }>(
      "SELECT id, is_active, password_hash FROM users WHERE username = $1 AND user_type = 'STAFF'",
      [username],
    );

    if (!inactiveUser) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    // Check if account is inactive
    if (!inactiveUser.is_active) {
      throw ApiError.forbidden("Account inactive");
    }

    if (!inactiveUser.password_hash) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    // Verify password
    const isValid = await verifyPassword(password, inactiveUser.password_hash);

    if (!isValid) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    // Query clinician profile
    const clinicianProfile = await db.oneOrNone<{ id: number }>(
      "SELECT id FROM clinician_profiles WHERE user_id = $1 AND is_active = TRUE",
      [inactiveUser.id],
    );

    // Check if user has CLINICIAN role (need to query without is_active filter for role check)
    const userRoles = await db.any<{ name: string }>(
      `
      SELECT DISTINCT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.is_active = TRUE
      `,
      [inactiveUser.id],
    );
    const isClinician = userRoles.some((r) => r.name === "CLINICIAN");

    // If user has CLINICIAN role but no clinician profile, deny access
    if (isClinician && !clinicianProfile) {
      throw ApiError.forbidden("Access denied");
    }

    // Generate tokens and return response
    return this.generateAuthResponse(inactiveUser.id, clinicianProfile?.id);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if session is valid
      const session =
        await authSessionRepository.findValidSession(refreshToken);

      if (!session) {
        throw ApiError.unauthorized("Invalid or expired refresh token");
      }

      // Generate new access token
      const accessToken = signAccessToken({
        userId: payload.userId,
        phone: payload.phone,
        userType: payload.userType,
        roles: payload.roles,
      });

      return { accessToken };
    } catch (error) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(userId: number, refreshToken: string): Promise<void> {
    await authSessionRepository.revokeSession(refreshToken);
    logger.info(`User ${userId} logged out`);
  }

  /**
   * Get current user details
   */
  async getCurrentUser(userId: number): Promise<AuthResponse["user"]> {
    const userWithRoles =
      await userRepository.findByIdWithRolesAndCentres(userId);

    if (!userWithRoles) {
      throw ApiError.notFound("User not found");
    }

    return this.formatUserResponse(userWithRoles);
  }

  /**
   * Generate auth response with tokens (private helper)
   */
  private async generateAuthResponse(
    userId: number,
    clinicianId?: number,
  ): Promise<AuthResponse> {
    const userWithRoles =
      await userRepository.findByIdWithRolesAndCentres(userId);

    if (!userWithRoles) {
      throw ApiError.notFound("User not found");
    }

    // Generate tokens
    const payload = {
      userId: userWithRoles.id,
      phone: userWithRoles.phone || "",
      userType: userWithRoles.user_type,
      roles: userWithRoles.roles,
      ...(clinicianId && { clinicianId }),
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store refresh token session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await authSessionRepository.createSession(userId, refreshToken, expiresAt);

    return {
      user: this.formatUserResponse(userWithRoles, clinicianId),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Format user response (private helper)
   */
  private formatUserResponse(
    user: any,
    clinicianId?: number,
  ): AuthResponse["user"] {
    // Extract role name from roles array
    let roleName = "staff"; // default
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      // roles might be array of objects {id, name} or array of strings
      const firstRole = user.roles[0];
      roleName =
        typeof firstRole === "string" ? firstRole : firstRole.name || firstRole;
    }

    // For FRONT_DESK users, set assignedCentreId to the first centre in centreIds
    const centreIds = (user.centreIds || []).map((id: number) => id.toString());
    const assignedCentreId =
      roleName === "FRONT_DESK" && centreIds.length > 0
        ? centreIds[0]
        : undefined;

    return {
      id: user.id.toString(),
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: roleName, // Primary role as string
      avatar: null, // TODO: Add avatar support
      centreIds: centreIds,
      ...(assignedCentreId && { assignedCentreId }), // Add assignedCentreId for FRONT_DESK
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      ...(clinicianId && { clinicianId }),
    };
  }
}

export const authService = new AuthService();
