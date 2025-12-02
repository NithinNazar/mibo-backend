// src/validations/auth.validation.ts
import { ApiError } from "../utils/apiError";

export function validatePhone(phone: unknown): string {
  if (typeof phone !== "string" || phone.trim().length < 8) {
    throw ApiError.badRequest("Invalid phone number");
  }
  return phone.trim();
}

export function validateOtp(otp: unknown): string {
  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    throw ApiError.badRequest("Invalid OTP format");
  }
  return otp;
}
