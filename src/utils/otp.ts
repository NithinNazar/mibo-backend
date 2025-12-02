// src/utils/otp.ts
import crypto from "crypto";

/*
 Generates a 6-digit numeric OTP.
*/
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/*
 Hash OTP before storing in database.
*/
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/*
 Compares a plain OTP with a stored hash.
*/
export function verifyOtp(plainOtp: string, hashedOtp: string): boolean {
  const hash = hashOtp(plainOtp);
  return hash === hashedOtp;
}
