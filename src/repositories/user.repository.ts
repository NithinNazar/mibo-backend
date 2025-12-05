// src/repositories/user.repository.ts
import { db } from "../config/db";
import { User, UserWithRoles } from "../types/user.types";

export class UserRepository {
  /*
   Finds a user by phone.
  */
  async findByPhone(phone: string): Promise<User | null> {
    const user = await db.oneOrNone<User>(
      "SELECT * FROM users WHERE phone = $1 AND is_active = TRUE",
      [phone]
    );
    return user;
  }

  /*
   Finds a user by id with all role names.
  */
  async findByIdWithRoles(userId: number): Promise<UserWithRoles | null> {
    const user = await db.oneOrNone<User>(
      "SELECT * FROM users WHERE id = $1 AND is_active = TRUE",
      [userId]
    );
    if (!user) return null;

    const roles = await db.any<{ name: string }>(
      `
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.is_active = TRUE
      `,
      [userId]
    );

    return {
      ...user,
      roles: roles.map((r) => r.name),
    };
  }

  /*
   Creates a basic patient user (for signup via OTP).
  */
  async createPatientUser(phone: string): Promise<User> {
    const query = `
      INSERT INTO users (phone, full_name, user_type, is_active)
      VALUES ($1, $2, 'PATIENT', TRUE)
      RETURNING *;
    `;
    const user = await db.one<User>(query, [phone, "Patient"]);
    return user;
  }

  /*
   Stores an OTP request in otp_requests table.
  */
  async createOtpRequest(params: {
    phone: string;
    otpHash: string;
    purpose: "LOGIN" | "SIGNUP" | "PASSWORD_RESET";
    expiresAt: Date;
  }): Promise<void> {
    const query = `
      INSERT INTO otp_requests (phone, otp_hash, purpose, expires_at, is_used, attempts_count)
      VALUES ($1, $2, $3, $4, FALSE, 0)
    `;
    await db.none(query, [
      params.phone,
      params.otpHash,
      params.purpose,
      params.expiresAt,
    ]);
  }

  /*
   Finds the latest active OTP request for the given phone and purpose.
  */
  async findLatestValidOtp(phone: string, purpose: string) {
    const query = `
      SELECT *
      FROM otp_requests
      WHERE phone = $1
        AND purpose = $2
        AND is_used = FALSE
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const record = await db.oneOrNone<{
      id: number;
      phone: string;
      otp_hash: string;
      purpose: string;
      expires_at: Date;
      is_used: boolean;
      attempts_count: number;
      created_at: Date;
    }>(query, [phone, purpose]);

    return record;
  }

  /*
   Marks an OTP as used and increments attempts if needed.
  */
  async markOtpUsed(otpId: number): Promise<void> {
    const query = `
      UPDATE otp_requests
      SET is_used = TRUE, attempts_count = attempts_count + 1
      WHERE id = $1
    `;
    await db.none(query, [otpId]);
  }

  async incrementOtpAttempts(otpId: number): Promise<void> {
    const query = `
      UPDATE otp_requests
      SET attempts_count = attempts_count + 1
      WHERE id = $1
    `;
    await db.none(query, [otpId]);
  }

  /**
   * Find staff user by phone (excludes PATIENT users)
   */
  async findByPhoneStaffOnly(phone: string): Promise<User | null> {
    const user = await db.oneOrNone<User>(
      "SELECT * FROM users WHERE phone = $1 AND user_type = 'STAFF' AND is_active = TRUE",
      [phone]
    );
    return user;
  }

  /**
   * Find staff user by username (excludes PATIENT users)
   */
  async findByUsernameStaffOnly(username: string): Promise<User | null> {
    const user = await db.oneOrNone<User>(
      "SELECT * FROM users WHERE username = $1 AND user_type = 'STAFF' AND is_active = TRUE",
      [username]
    );
    return user;
  }

  /**
   * Find staff user by email (excludes PATIENT users)
   */
  async findByEmailStaffOnly(email: string): Promise<User | null> {
    const user = await db.oneOrNone<User>(
      "SELECT * FROM users WHERE email = $1 AND user_type = 'STAFF' AND is_active = TRUE",
      [email]
    );
    return user;
  }

  /**
   * Find user by ID with roles and centre assignments
   */
  async findByIdWithRolesAndCentres(
    userId: number
  ): Promise<UserWithRoles | null> {
    const user = await db.oneOrNone<User>(
      "SELECT * FROM users WHERE id = $1 AND is_active = TRUE",
      [userId]
    );
    if (!user) return null;

    // Get roles
    const roles = await db.any<{ name: string }>(
      `
      SELECT DISTINCT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.is_active = TRUE
      `,
      [userId]
    );

    // Get centre assignments
    const centres = await db.any<{ centre_id: number }>(
      `
      SELECT DISTINCT centre_id
      FROM user_roles
      WHERE user_id = $1 AND is_active = TRUE AND centre_id IS NOT NULL
      `,
      [userId]
    );

    return {
      ...user,
      roles: roles.map((r) => r.name),
      centreIds: centres.map((c) => c.centre_id),
    };
  }

  /**
   * Create staff user with password
   */
  async createStaffUser(params: {
    phone: string;
    email?: string;
    username?: string;
    passwordHash: string;
    fullName: string;
  }): Promise<User> {
    const query = `
      INSERT INTO users (phone, email, username, password_hash, full_name, user_type, is_active)
      VALUES ($1, $2, $3, $4, $5, 'STAFF', TRUE)
      RETURNING *
    `;

    const user = await db.one<User>(query, [
      params.phone,
      params.email || null,
      params.username || null,
      params.passwordHash,
      params.fullName,
    ]);

    return user;
  }
}

export const userRepository = new UserRepository();
