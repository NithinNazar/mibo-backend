// src/repositories/patient.repository.ts
import { db } from "../config/db";
import bcrypt from "bcrypt";

export interface User {
  id: number;
  phone: string;
  email: string | null;
  full_name: string;
  user_type: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PatientProfile {
  id: number;
  user_id: number;
  date_of_birth: Date | null;
  gender: string | null;
  blood_group: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OTPRequest {
  id: number;
  phone: string;
  otp_hash: string;
  purpose: string;
  expires_at: Date;
  is_used: boolean;
  attempts_count: number;
  created_at: Date;
}

export interface AuthSession {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

class PatientRepository {
  /**
   * Find user by phone number
   */
  async findUserByPhone(phone: string): Promise<User | null> {
    return await db.oneOrNone(
      "SELECT * FROM users WHERE phone = $1 AND user_type = 'PATIENT'",
      [phone],
    );
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: number): Promise<User | null> {
    return await db.oneOrNone("SELECT * FROM users WHERE id = $1", [userId]);
  }

  /**
   * Create new user
   */
  async createUser(
    phone: string,
    fullName: string,
    email?: string,
  ): Promise<User> {
    return await db.one(
      `INSERT INTO users (phone, full_name, email, user_type, is_active)
       VALUES ($1, $2, $3, 'PATIENT', true)
       RETURNING *`,
      [phone, fullName, email || null],
    );
  }

  /**
   * Create new user with transaction safety
   * Uses database transaction to prevent race conditions
   */
  async createUserWithTransaction(
    phone: string,
    fullName: string,
    email?: string,
  ): Promise<User> {
    return await db.tx(async (t) => {
      // Check if user exists with row lock to prevent race condition
      const existingUser = await t.oneOrNone(
        "SELECT * FROM users WHERE phone = $1 AND user_type = 'PATIENT' FOR UPDATE",
        [phone],
      );

      if (existingUser) {
        // User was created by another concurrent request
        return existingUser;
      }

      // Create new user
      return await t.one(
        `INSERT INTO users (phone, full_name, email, user_type, is_active)
         VALUES ($1, $2, $3, 'PATIENT', true)
         RETURNING *`,
        [phone, fullName, email || null],
      );
    });
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: number,
    data: { full_name?: string; email?: string },
  ): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.full_name) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(data.full_name);
    }

    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    return await db.one(
      `UPDATE users SET ${updates.join(
        ", ",
      )} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );
  }

  /**
   * Find patient profile by user ID
   */
  async findPatientProfileByUserId(
    userId: number,
  ): Promise<PatientProfile | null> {
    return await db.oneOrNone(
      "SELECT * FROM patient_profiles WHERE user_id = $1",
      [userId],
    );
  }

  /**
   * Create patient profile
   */
  async createPatientProfile(userId: number): Promise<PatientProfile> {
    return await db.one(
      `INSERT INTO patient_profiles (user_id, is_active)
       VALUES ($1, true)
       RETURNING *`,
      [userId],
    );
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(
    userId: number,
    data: {
      date_of_birth?: Date;
      gender?: string;
      blood_group?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
    },
  ): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.date_of_birth) {
      updates.push(`date_of_birth = $${paramIndex++}`);
      values.push(data.date_of_birth);
    }

    if (data.gender) {
      updates.push(`gender = $${paramIndex++}`);
      values.push(data.gender);
    }

    if (data.blood_group) {
      updates.push(`blood_group = $${paramIndex++}`);
      values.push(data.blood_group);
    }

    if (data.emergency_contact_name) {
      updates.push(`emergency_contact_name = $${paramIndex++}`);
      values.push(data.emergency_contact_name);
    }

    if (data.emergency_contact_phone) {
      updates.push(`emergency_contact_phone = $${paramIndex++}`);
      values.push(data.emergency_contact_phone);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const profile = await db.one(
      `UPDATE patient_profiles SET ${updates.join(
        ", ",
      )} WHERE user_id = $${paramIndex} RETURNING *`,
      values,
    );

    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');

    return {
      userId: user.id,
      fullName: user.full_name,
      phone: user.phone,
      email: user.email,
      // username: user.username,
      createdAt: user.created_at,
      id: profile.id,
      dateOfBirth: profile.date_of_birth,
      gender: profile.gender,
      bloodGroup: profile.blood_group,
      emergencyContactName: profile.emergency_contact_name,
      emergencyContactPhone: profile.emergency_contact_phone,
      notes: profile.notes,
    };
  }

  /**
   * Store OTP request
   */
  async storeOTP(
    phone: string,
    otp: string,
    purpose: string = "LOGIN",
  ): Promise<OTPRequest> {
    // Hash OTP before storing
    const otpHash = await bcrypt.hash(otp, 10);

    // Delete any existing unused OTPs for this phone
    await db.none(
      "DELETE FROM otp_requests WHERE phone = $1 AND is_used = false",
      [phone],
    );

    // Store new OTP
    return await db.one(
      `INSERT INTO otp_requests (phone, otp_hash, purpose, expires_at, is_used, attempts_count)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes', false, 0)
       RETURNING *`,
      [phone, otpHash, purpose],
    );
  }

  /**
   * Count recent OTP requests for rate limiting
   * Returns number of OTP requests made in the last N minutes
   */
  async countRecentOTPRequests(
    phone: string,
    minutes: number = 5,
  ): Promise<number> {
    const result = await db.one(
      `SELECT COUNT(*) as count 
       FROM otp_requests 
       WHERE phone = $1 
       AND created_at > NOW() - INTERVAL '${minutes} minutes'`,
      [phone],
    );
    return parseInt(result.count);
  }

  /**
   * Find valid OTP request
   */
  async findValidOTP(phone: string): Promise<OTPRequest | null> {
    return await db.oneOrNone(
      `SELECT * FROM otp_requests 
       WHERE phone = $1 
       AND is_used = false 
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone],
    );
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    const otpRequest = await this.findValidOTP(phone);

    if (!otpRequest) {
      return false;
    }

    // Increment attempts
    await db.none(
      "UPDATE otp_requests SET attempts_count = attempts_count + 1 WHERE id = $1",
      [otpRequest.id],
    );

    // Check if too many attempts (max 5)
    if (otpRequest.attempts_count >= 5) {
      await this.markOTPAsUsed(otpRequest.id);
      return false;
    }

    // Verify OTP hash
    const isValid = await bcrypt.compare(otp, otpRequest.otp_hash);

    if (isValid) {
      // Mark OTP as used
      await this.markOTPAsUsed(otpRequest.id);
    }

    return isValid;
  }

  /**
   * Mark OTP as used
   */
  async markOTPAsUsed(otpId: number): Promise<void> {
    await db.none("UPDATE otp_requests SET is_used = true WHERE id = $1", [
      otpId,
    ]);
  }

  /**
   * Create auth session
   */
  async createAuthSession(
    userId: number,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSession> {
    // Hash refresh token before storing
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    return await db.one(
      `INSERT INTO auth_sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
       RETURNING *`,
      [userId, refreshTokenHash, userAgent || null, ipAddress || null],
    );
  }

  /**
   * Find auth session by user ID and refresh token
   */
  async findAuthSession(
    userId: number,
    refreshToken: string,
  ): Promise<AuthSession | null> {
    const sessions = await db.any(
      `SELECT * FROM auth_sessions 
       WHERE user_id = $1 
       AND revoked_at IS NULL 
       AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId],
    );

    // Check each session's refresh token hash
    for (const session of sessions) {
      const isValid = await bcrypt.compare(
        refreshToken,
        session.refresh_token_hash,
      );
      if (isValid) {
        return session;
      }
    }

    return null;
  }

  /**
   * Revoke auth session
   */
  async revokeAuthSession(sessionId: number): Promise<void> {
    await db.none("UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1", [
      sessionId,
    ]);
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(userId: number): Promise<void> {
    await db.none(
      "UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId],
    );
  }

  /**
   * Find user and patient profile by user ID
   */
  async findByUserId(userId: number): Promise<{
    user: User;
    profile: PatientProfile;
  } | null> {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const profile = await this.findPatientProfileByUserId(userId);
    if (!profile) return null;

    return { user, profile };
  }

  async findByPatientId(patientId: number): Promise<{
    user: User;
    profile: PatientProfile;
  } | null> {
    const profile = await this.findPatientProfileByPatientId(patientId);
    if (!profile) return null;
    const user = await this.findUserById(profile.user_id);
    if (!user) return null;

    return { user, profile };
  }

   async findPatientProfileByPatientId(
    patientId: number,
  ): Promise<PatientProfile | null> {
    return await db.oneOrNone(
      "SELECT * FROM patient_profiles WHERE id = $1",
      [patientId],
    );
  }

  /**
   * Get patient appointments with details
   */
  async getPatientAppointments(patientId: number): Promise<any[]> {
    return await db.any(
      `SELECT 
        a.*,
        u.full_name as clinician_name,
        cp.specialization,
        c.name as centre_name,
        c.address_line1,
        c.city,
        vs.join_url as meet_link,
        vs.status as video_status,
        p.status as payment_status,
        p.amount as payment_amount
      FROM appointments a
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON a.centre_id = c.id
      LEFT JOIN video_sessions vs ON a.id = vs.appointment_id
      LEFT JOIN payments p ON a.id = p.appointment_id
      WHERE a.patient_id = $1
      ORDER BY a.scheduled_start_at DESC`,
      [patientId],
    );
  }

  /**
   * Get patient payments with details
   */
  async getPatientPayments(patientId: number): Promise<any[]> {
    return await db.any(
      `SELECT 
        p.*,
        a.scheduled_start_at,
        a.appointment_type,
        u.full_name as clinician_name,
        c.name as centre_name
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON a.centre_id = c.id
      WHERE p.patient_id = $1
      ORDER BY p.created_at DESC`,
      [patientId],
    );
  }

  /**
   * Find all patients with optional search filters
   */
  async findPatients(search?: string, phone?: string): Promise<any[]> {
    const conditions: string[] = [
      "u.user_type = 'PATIENT'",
      "u.is_active = TRUE",
    ];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`u.full_name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (phone) {
      conditions.push(`u.phone ILIKE $${paramIndex}`);
      params.push(`%${phone}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.phone,
        u.email,
        u.username,
        u.created_at,
        pp.id as profile_id,
        pp.date_of_birth,
        pp.gender,
        pp.blood_group,
        pp.emergency_contact_name,
        pp.emergency_contact_phone,
        pp.notes,
        (
          SELECT COUNT(*) 
          FROM appointments a 
          WHERE a.patient_id = u.id 
          AND a.scheduled_start_at > NOW()
          AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
        ) as upcoming_appointments_count,
        (
          SELECT COUNT(*) 
          FROM appointments a 
          WHERE a.patient_id = u.id 
          AND a.scheduled_start_at <= NOW()
        ) as past_appointments_count,
        (
          SELECT json_agg(
            json_build_object(
              'id', a.id,
              'scheduled_start_at', a.scheduled_start_at,
              'scheduled_end_at', a.scheduled_end_at,
              'appointment_type', a.appointment_type,
              'status', a.status,
              'clinician_name', cu.full_name,
              'centre_name', c.name
            ) ORDER BY a.scheduled_start_at ASC
          )
          FROM appointments a
          JOIN clinician_profiles cp ON a.clinician_id = cp.id
          JOIN users cu ON cp.user_id = cu.id
          JOIN centres c ON a.centre_id = c.id
          WHERE a.patient_id = u.id 
          AND a.scheduled_start_at > NOW()
          AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
          LIMIT 5
        ) as upcoming_appointments
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.created_at DESC
    `;

    const results = await db.any(query, params);
    
    return results.map(row => ({
      userId: row.user_id,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      username: row.username,
      createdAt: row.created_at,
      id: row.profile_id,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      bloodGroup: row.blood_group,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      notes: row.notes,
      upcomingAppointmentsCount: row.upcoming_appointments_count,
      pastAppointmentsCount: row.past_appointments_count,
      upcomingAppointments: row.upcoming_appointments
    }));

  }

  /**
   * Find patient by ID with complete details
   */
  async findPatientById(patientId: number): Promise<any | null> {
    const query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.phone,
        u.email,
        u.username,
        u.created_at,
        u.updated_at,
        pp.id as profile_id,
        pp.date_of_birth,
        pp.gender,
        pp.blood_group,
        pp.emergency_contact_name,
        pp.emergency_contact_phone,
        pp.notes
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      WHERE u.id = $1 AND u.user_type = 'PATIENT'
    `;

    return await db.oneOrNone(query, [patientId]);
  }

  /**
   * Check if phone number already exists
   */
  async checkPhoneExists(phone: string): Promise<boolean> {
    const result = await db.oneOrNone(
      "SELECT id FROM users WHERE phone = $1 AND user_type = 'PATIENT'",
      [phone],
    );
    return result !== null;
  }

  /**
   * Create patient with user and profile
   */
  async createPatient(data: {
    phone: string;
    full_name: string;
    email?: string;
    date_of_birth?: Date;
    gender?: string;
    blood_group?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    notes?: string;
  }): Promise<any> {
    return await db.tx(async (t) => {
      // Create user
      const user = await t.one(
        `INSERT INTO users (phone, full_name, email, user_type, is_active)
         VALUES ($1, $2, $3, 'PATIENT', TRUE)
         RETURNING *`,
        [data.phone, data.full_name, data.email || null],
      );

      // Create patient profile
      const profile = await t.one(
        `INSERT INTO patient_profiles (
          user_id, 
          date_of_birth, 
          gender, 
          blood_group,
          emergency_contact_name,
          emergency_contact_phone,
          notes,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        RETURNING *`,
        [
          user.id,
          data.date_of_birth || null,
          data.gender || null,
          data.blood_group || null,
          data.emergency_contact_name || null,
          data.emergency_contact_phone || null,
          data.notes || null,
        ],
      );

      return {
        userId: user.id,
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
        id: profile.id,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        bloodGroup: profile.blood_group,
        emergencyContactName: profile.emergency_contact_name,
        emergencyContactPhone: profile.emergency_contact_phone,
        notes: profile.notes,
      };
    });
  }

  /**
   * Add medical note to patient
   */
  async addMedicalNote(
    patientId: number,
    note: string,
    authorUserId: number,
  ): Promise<any> {
    return await db.one(
      `INSERT INTO patient_medical_notes (patient_id, author_user_id, note_text, visibility)
       VALUES ($1, $2, $3, 'INTERNAL')
       RETURNING *`,
      [patientId, authorUserId, note],
    );
  }

  /**
   * Clean up expired OTPs and sessions (maintenance task)
   */
  async cleanupExpiredData(): Promise<void> {
    // Delete expired OTPs older than 24 hours
    await db.none(
      "DELETE FROM otp_requests WHERE expires_at < NOW() - INTERVAL '24 hours'",
    );

    // Delete expired sessions older than 30 days
    await db.none(
      "DELETE FROM auth_sessions WHERE expires_at < NOW() - INTERVAL '30 days'",
    );
  }
}

export const patientRepository = new PatientRepository();
