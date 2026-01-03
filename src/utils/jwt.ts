// src/utils/jwt.ts
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export interface JwtPayload {
  userId: number;
  phone: string;
  userType: "PATIENT" | "STAFF";
  roles: string[];
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload as any, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRY,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload as any, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRY,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
  return decoded as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET);
  return decoded as JwtPayload;
}
