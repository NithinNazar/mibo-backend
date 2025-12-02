// src/utils/jwt.ts
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

const JWT_SECRET = ENV.JWT_SECRET || "change_this_secret";
const ACCESS_TOKEN_EXPIRY = "1h"; // Adjust as needed

export interface JwtPayload {
  userId: number;
  userType: "PATIENT" | "STAFF";
  roles: string[];
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as JwtPayload;
}
