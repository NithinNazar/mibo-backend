// src/services/patient-auth.service.ts
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { patientRepository } from "../repositories/patient.repository";
import { gallaboxUtil } from "../utils/gallabox";
import { JwtPayload } from "../utils/jwt";
import logger from "../config/logger";

class PatientAuthService {
  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload as any, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRY,
    } as jwt.SignOptions);
  }

  /**
   * Generate JWT refresh token
   */
  private generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload as any, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRY,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error("Invalid or expired access token");
    }
  }

  /**
   * Verify JWT refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Send OTP to patient's phone via WhatsApp
   */
  async sendOTP(phone: string): Promise<{ isNewUser: boolean }> {
    try {
      // TEST USER: Skip rate limiting and SMS for test phone number
      const TEST_PHONE = process.env.TEST_PHONE_NUMBER;
      const TEST_OTP = process.env.TEST_OTP;

      if (TEST_PHONE && TEST_OTP && phone === TEST_PHONE) {
        logger.info(`🧪 TEST USER: Using hardcoded OTP for ${phone}`);

        // Check if user exists
        const existingUser = await patientRepository.findUserByPhone(phone);
        const isNewUser = !existingUser;

        // Store test OTP in database
        await patientRepository.storeOTP(phone, TEST_OTP, "LOGIN");

        console.log(
          `\n🧪 TEST USER LOGIN\n📱 Phone: ${phone}\n🔐 OTP: ${TEST_OTP}\n`,
        );

        return { isNewUser };
      }

      // REGULAR FLOW: Rate limiting and SMS
      // Rate limiting: Check if too many OTP requests in last 5 minutes
      const recentRequests = await patientRepository.countRecentOTPRequests(
        phone,
        5,
      );

      if (recentRequests >= 3) {
        throw new Error(
          "Too many OTP requests. Please try again after 5 minutes.",
        );
      }

      // Check if user exists
      const existingUser = await patientRepository.findUserByPhone(phone);
      const isNewUser = !existingUser;

      // Generate OTP
      const otp = this.generateOTP();

      // Store OTP in database
      await patientRepository.storeOTP(phone, otp, "LOGIN");

      // Send OTP via WhatsApp
      if (gallaboxUtil.isReady()) {
        const result = await gallaboxUtil.sendOTP(phone, otp);

        if (result.success) {
          logger.info(`✅ OTP sent to ${phone} via WhatsApp`);
        } else {
          logger.warn(
            `⚠️ WhatsApp send failed for ${phone}, but OTP stored in database`,
          );
        }
      } else {
        logger.warn(
          `⚠️ Gallabox not configured - OTP stored but not sent via WhatsApp`,
        );
      }

      // In development, log OTP to console
      if (ENV.NODE_ENV === "development") {
        console.log(`\n🔐 OTP for ${phone}: ${otp}\n`);
      }

      return { isNewUser };
    } catch (error: any) {
      logger.error("Error sending OTP:", error);
      throw error;
    }
  }

  /**
   * Verify OTP and login/signup patient
   * Note: Test user (TEST_PHONE_NUMBER) will work with TEST_OTP from .env
   */
  async verifyOTPAndLogin(
    phone: string,
    otp: string,
    firstName?: string,
    lastName?: string,
    email?: string,
    age?: number,
    gender?: string,
  ): Promise<{
    user: any;
    patient: any;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
    requiresProfileCompletion: boolean;
  }> {
    try {
      // Verify OTP (works for both regular and test users)
      const isValidOTP = await patientRepository.verifyOTP(phone, otp);

      if (!isValidOTP) {
        throw new Error("Invalid or expired OTP. Please request a new OTP.");
      }

      // Check if user exists
      let user = await patientRepository.findUserByPhone(phone);
      let isNewUser = false;
      let requiresProfileCompletion = false;

      if (!user) {
        // New user - create account with transaction safety
        if (!firstName || !lastName) {
          throw new Error(
            "First name and last name are required for new users",
          );
        }

        user = await patientRepository.createUserWithTransaction(
          phone,
          firstName,
          lastName,
          email,
        );
        isNewUser = true;

        logger.info(`✅ New patient account created: ${phone}`);
      } else {
        // Existing user - check if they are a legacy user
        const isLegacyUser = !user.first_name || !user.last_name;

        if (isLegacyUser && (firstName || lastName || email)) {
          // Legacy user providing profile completion data
          const updateData: any = {};
          if (firstName) updateData.first_name = firstName;
          if (lastName) updateData.last_name = lastName;
          if (firstName && lastName) {
            updateData.full_name = `${firstName} ${lastName}`.trim();
          }
          if (email) updateData.email = email;

          if (Object.keys(updateData).length > 0) {
            user = await patientRepository.updateUser(user.id, updateData);
          }
        } else if (isLegacyUser) {
          // Legacy user not providing data yet - flag for profile completion
          requiresProfileCompletion = true;
          logger.info(
            `⚠️ Legacy user detected: ${phone} - requires profile completion`,
          );
        } else if (firstName || lastName || email) {
          // Regular existing user updating info
          const updateData: any = {};
          if (firstName) updateData.first_name = firstName;
          if (lastName) updateData.last_name = lastName;
          if (firstName && lastName) {
            updateData.full_name = `${firstName} ${lastName}`.trim();
          }
          if (email) updateData.email = email;

          if (Object.keys(updateData).length > 0) {
            user = await patientRepository.updateUser(user.id, updateData);
          }
        }
      }

      // Get or create patient profile
      let patient = await patientRepository.findPatientProfileByUserId(user.id);

      if (!patient) {
        // Create new profile with age and gender if provided
        patient = await patientRepository.createPatientProfile(
          user.id,
          age,
          gender,
        );
      } else {
        // Check if patient profile is incomplete (legacy user)
        const hasIncompleteProfile =
          patient.age === null || patient.gender === null;

        if (hasIncompleteProfile && (age !== undefined || gender)) {
          // Update existing profile with completion data
          const profileUpdates: any = {};
          if (age !== undefined) profileUpdates.age = age;
          if (gender) profileUpdates.gender = gender;

          if (Object.keys(profileUpdates).length > 0) {
            await patientRepository.updatePatientProfile(
              user.id,
              profileUpdates,
            );
            patient = await patientRepository.findPatientProfileByUserId(
              user.id,
            );
            requiresProfileCompletion = false; // Profile now complete
          }
        } else if (hasIncompleteProfile) {
          // 🔧 FIX: Only flag for profile completion if ALSO a legacy user (missing name)
          // This prevents complete users with missing age/gender from being flagged
          const isLegacyUser = !user.first_name || !user.last_name;
          if (isLegacyUser) {
            requiresProfileCompletion = true;
            logger.info(
              `⚠️ Legacy user with incomplete profile: ${phone} - requires completion`,
            );
          }
          // If user has name but missing age/gender, don't force modal
          // They can update via profile settings later
        } else if (age !== undefined || gender) {
          // Update existing complete profile
          const profileUpdates: any = {};
          if (age !== undefined) profileUpdates.age = age;
          if (gender) profileUpdates.gender = gender;

          if (Object.keys(profileUpdates).length > 0) {
            await patientRepository.updatePatientProfile(
              user.id,
              profileUpdates,
            );
            patient = await patientRepository.findPatientProfileByUserId(
              user.id,
            );
          }
        }
      }

      // Generate tokens
      const tokenPayload: JwtPayload = {
        userId: user.id,
        phone: user.phone,
        userType: user.user_type as "PATIENT" | "STAFF",
        roles: [],
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      // Store refresh token in database
      await patientRepository.createAuthSession(user.id, refreshToken);

      logger.info(`✅ Patient logged in: ${phone}`);

      // Ensure patient is not null before returning
      if (!patient) {
        throw new Error("Failed to create or retrieve patient profile");
      }

      return {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.full_name,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
        },
        patient: {
          id: patient.id,
          dateOfBirth: patient.date_of_birth,
          age: patient.age,
          gender: patient.gender,
          bloodGroup: patient.blood_group,
        },
        accessToken,
        refreshToken,
        isNewUser,
        requiresProfileCompletion,
      };
    } catch (error: any) {
      logger.error("Error verifying OTP:", error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
  }> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken);

      // Check if session exists and is valid
      const session = await patientRepository.findAuthSession(
        payload.userId,
        refreshToken,
      );

      if (!session) {
        throw new Error("Invalid refresh token or session expired");
      }

      // Get user data
      const user = await patientRepository.findUserById(payload.userId);

      if (!user || !user.is_active) {
        throw new Error("User not found or inactive");
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken({
        userId: user.id,
        phone: user.phone,
        userType: user.user_type as "PATIENT" | "STAFF",
        roles: [],
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (error: any) {
      logger.error("Error refreshing token:", error);
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Logout patient (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      const session = await patientRepository.findAuthSession(
        payload.userId,
        refreshToken,
      );

      if (session) {
        await patientRepository.revokeAuthSession(session.id);
        logger.info(`✅ Patient logged out: ${payload.phone}`);
      }
    } catch (error: any) {
      logger.error("Error logging out:", error);
      // Don't throw error - logout should always succeed
    }
  }

  /**
   * Get patient profile by user ID
   */
  async getPatientProfile(userId: number): Promise<{
    user: any;
    patient: any;
  }> {
    const user = await patientRepository.findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const patient = await patientRepository.findPatientProfileByUserId(userId);

    if (!patient) {
      throw new Error("Patient profile not found");
    }

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        isActive: user.is_active,
        createdAt: user.created_at,
      },
      patient: {
        id: patient.id,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        bloodGroup: patient.blood_group,
        emergencyContactName: patient.emergency_contact_name,
        emergencyContactPhone: patient.emergency_contact_phone,
        notes: patient.notes,
        isActive: patient.is_active,
      },
    };
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(
    userId: number,
    data: {
      fullName?: string;
      email?: string;
      dateOfBirth?: Date;
      gender?: string;
      bloodGroup?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    },
  ): Promise<{
    user: any;
    patient: any;
  }> {
    // Update user info
    const userUpdates: any = {};
    if (data.fullName) userUpdates.full_name = data.fullName;
    if (data.email !== undefined) userUpdates.email = data.email;

    if (Object.keys(userUpdates).length > 0) {
      await patientRepository.updateUser(userId, userUpdates);
    }

    // Update patient profile
    const patientUpdates: any = {};
    if (data.dateOfBirth) patientUpdates.date_of_birth = data.dateOfBirth;
    if (data.gender) patientUpdates.gender = data.gender;
    if (data.bloodGroup) patientUpdates.blood_group = data.bloodGroup;
    if (data.emergencyContactName)
      patientUpdates.emergency_contact_name = data.emergencyContactName;
    if (data.emergencyContactPhone)
      patientUpdates.emergency_contact_phone = data.emergencyContactPhone;

    if (Object.keys(patientUpdates).length > 0) {
      await patientRepository.updatePatientProfile(userId, patientUpdates);
    }

    // Return updated profile
    return await this.getPatientProfile(userId);
  }

  /**
   * NEW: Login with username and password (for Razorpay verification)
   */
  async loginWithPassword(
    username: string,
    password: string,
  ): Promise<{
    user: any;
    patient: any;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Find user by username
      const user = await patientRepository.findUserByUsername(username);

      if (!user) {
        throw new Error("Invalid username or password");
      }

      // Check if user has a password set
      const userWithPassword = await patientRepository.findUserById(user.id);
      if (!userWithPassword) {
        throw new Error("Invalid username or password");
      }

      // Verify password
      const passwordHash = (userWithPassword as any).password_hash;
      if (!passwordHash) {
        throw new Error("This account does not have password login enabled");
      }

      const isValidPassword = await patientRepository.verifyPassword(
        passwordHash,
        password,
      );

      if (!isValidPassword) {
        throw new Error("Invalid username or password");
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error("Account is inactive");
      }

      // Get or create patient profile
      let patient = await patientRepository.findPatientProfileByUserId(user.id);

      if (!patient) {
        patient = await patientRepository.createPatientProfile(user.id);
      }

      // Generate tokens
      const tokenPayload: JwtPayload = {
        userId: user.id,
        phone: user.phone,
        userType: user.user_type as "PATIENT" | "STAFF",
        roles: [],
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      // Store refresh token in database
      await patientRepository.createAuthSession(user.id, refreshToken);

      logger.info(`✅ Patient logged in with username: ${username}`);

      return {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.full_name,
          userType: user.user_type,
        },
        patient: {
          id: patient.id,
          dateOfBirth: patient.date_of_birth,
          gender: patient.gender,
          bloodGroup: patient.blood_group,
        },
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      logger.error("Error logging in with password:", error);
      throw error;
    }
  }
}

export const patientAuthService = new PatientAuthService();
