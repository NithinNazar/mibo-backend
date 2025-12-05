// src/repositories/authSession.repository.ts
import { db } from "../config/db";
import crypto from "crypto";

interface AuthSession {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export class AuthSessionRepository {
  /**
   * Create a new auth session with refresh token
   */
  async createSession(
    userId: number,
    refreshToken: string,
    expiresAt: Date
  ): Promise<AuthSession> {
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const query = `
      INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const session = await db.one<AuthSession>(query, [
      userId,
      refreshTokenHash,
      expiresAt,
    ]);

    return session;
  }

  /**
   * Find a valid (non-revoked, non-expired) session by refresh token
   */
  async findValidSession(refreshToken: string): Promise<AuthSession | null> {
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const query = `
      SELECT *
      FROM auth_sessions
      WHERE refresh_token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `;

    const session = await db.oneOrNone<AuthSession>(query, [refreshTokenHash]);
    return session;
  }

  /**
   * Revoke a session by refresh token
   */
  async revokeSession(refreshToken: string): Promise<void> {
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const query = `
      UPDATE auth_sessions
      SET revoked_at = NOW()
      WHERE refresh_token_hash = $1
        AND revoked_at IS NULL
    `;

    await db.none(query, [refreshTokenHash]);
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: number): Promise<void> {
    const query = `
      UPDATE auth_sessions
      SET revoked_at = NOW()
      WHERE user_id = $1
        AND revoked_at IS NULL
    `;

    await db.none(query, [userId]);
  }

  /**
   * Clean up expired sessions (maintenance task)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const query = `
      DELETE FROM auth_sessions
      WHERE expires_at < NOW() - INTERVAL '30 days'
    `;

    const result = await db.result(query);
    return result.rowCount;
  }
}

export const authSessionRepository = new AuthSessionRepository();
