// src/services/auth.service.ts
import { userRepository } from "../repositories/user.repository";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otp";
import { ApiError } from "../utils/apiError";
import { signAccessToken } from "../utils/jwt";
import { ENV } from "../config/env";

export class AuthService {
  /*
   Trigger OTP for login/signup.
   This will create user if not existing (patient use case).
   Gallabox integration for WhatsApp sending will be plugged in here later.
  */
  async requestOtp(phone: string) {
    let user = await userRepository.findByPhone(phone);

    const purpose: "LOGIN" | "SIGNUP" = user ? "LOGIN" : "SIGNUP";

    if (!user) {
      user = await userRepository.createPatientUser(phone);
      // In future, also assign PATIENT role explicitly if needed.
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await userRepository.createOtpRequest({
      phone,
      otpHash,
      purpose,
      expiresAt,
    });

    // Integration point: send OTP via Gallabox WhatsApp here.
    if (!ENV.GALLABOX_API_KEY) {
      // For now, we can log OTP in development.
      // In production, remove this and rely only on WhatsApp.
      // console.log("OTP for", phone, "is", otp);
    }

    return {
      userId: user.id,
      phone: user.phone,
      purpose,
      // For development only, you might return otp.
      // Do not return OTP in production responses.
    };
  }

  /*
   Verifies OTP and returns a JWT if valid.
  */
  async verifyOtpAndLogin(phone: string, otp: string) {
    const user = await userRepository.findByPhone(phone);
    if (!user) {
      throw ApiError.unauthorized("User not found for this phone number");
    }

    const otpRecord = await userRepository.findLatestValidOtp(phone, "LOGIN");
    const signupOtpRecord = await userRepository.findLatestValidOtp(
      phone,
      "SIGNUP"
    );
    const record = otpRecord || signupOtpRecord;

    if (!record) {
      throw ApiError.badRequest("No valid OTP request found or OTP expired");
    }

    const isValid = verifyOtp(otp, record.otp_hash);
    if (!isValid) {
      await userRepository.incrementOtpAttempts(record.id);
      throw ApiError.badRequest("Invalid OTP");
    }

    await userRepository.markOtpUsed(record.id);

    // For now, get roles minimally (can be expanded later).
    const userWithRoles = await userRepository.findByIdWithRoles(user.id);
    const roles = userWithRoles?.roles || [];

    const token = signAccessToken({
      userId: user.id,
      userType: user.user_type,
      roles,
    });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        user_type: user.user_type,
        roles,
      },
    };
  }
}

export const authService = new AuthService();
