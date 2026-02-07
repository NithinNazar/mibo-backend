// src/repositories/staff.repository.ts
import { db } from "../config/db";
import { hashPassword } from "../utils/password";

interface StaffFilters {
  roleId?: number;
  centreId?: number;
}

interface ClinicianFilters {
  centreId?: number;
  specialization?: string;
}

interface CreateStaffData {
  full_name: string;
  phone: string;
  email?: string;
  username?: string;
  password: string;
  designation?: string;
}

interface CreateClinicianData {
  user_id: number;
  primary_centre_id: number;
  specialization: string[]; // Changed to array
  registration_number?: string;
  years_of_experience?: number; // Fixed: match database column name
  consultation_fee?: number;
  bio?: string;
  consultation_modes?: string[];
  default_consultation_duration_minutes?: number;
  profile_picture_url?: string;
  qualification?: string[]; // Changed to array
  expertise?: string[];
  languages?: string[];
}

interface AvailabilityRule {
  centre_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  consultation_mode: string;
}

export class StaffRepository {
  /**
   * Find staff users with role and centre filters
   */
  async findStaffUsers(filters?: StaffFilters) {
    const conditions: string[] = [
      "u.user_type = 'STAFF'",
      "u.is_active = TRUE",
      "sp.is_active = TRUE",
    ];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.roleId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = u.id
          AND ur.role_id = $${paramIndex}
          AND ur.is_active = TRUE
      )`);
      params.push(filters.roleId);
      paramIndex++;
    }

    if (filters?.centreId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = u.id
          AND ur.centre_id = $${paramIndex}
          AND ur.is_active = TRUE
      )`);
      params.push(filters.centreId);
      paramIndex++;
    }

    const query = `
      SELECT
        u.id,
        u.full_name,
        u.phone,
        u.email,
        u.username,
        sp.designation,
        sp.profile_picture_url,
        u.created_at
      FROM users u
      JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.full_name ASC
    `;

    return db.any(query, params);
  }

  /**
   * Find staff by ID with roles and centre assignments
   */
  async findStaffById(userId: number) {
    const query = `
      SELECT
        u.*,
        sp.designation,
        sp.profile_picture_url,
        sp.bio
      FROM users u
      JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.id = $1
        AND u.user_type = 'STAFF'
        AND u.is_active = TRUE
    `;

    const user = await db.oneOrNone(query, [userId]);
    if (!user) return null;

    // Get roles
    const roles = await db.any(
      `
      SELECT r.id, r.name, ur.centre_id, ur.is_primary
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND ur.is_active = TRUE
      `,
      [userId],
    );

    // Get centre assignments
    const centres = await db.any(
      `
      SELECT DISTINCT c.id, c.name, c.city
      FROM user_roles ur
      JOIN centres c ON c.id = ur.centre_id
      WHERE ur.user_id = $1
        AND ur.centre_id IS NOT NULL
        AND ur.is_active = TRUE
      `,
      [userId],
    );

    return { ...user, roles, centres };
  }

  /**
   * Create staff user with user, user_roles, and centre_staff_assignments
   */
  async createStaffUser(
    data: CreateStaffData,
    roleIds: number[],
    centreIds: number[],
  ) {
    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const userQuery = `
      INSERT INTO users (
        full_name,
        phone,
        email,
        username,
        password_hash,
        user_type,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, 'STAFF', TRUE)
      RETURNING *;
    `;

    const user = await db.one(userQuery, [
      data.full_name,
      data.phone,
      data.email || null,
      data.username || null,
      passwordHash,
    ]);

    // Create staff profile
    const profileQuery = `
      INSERT INTO staff_profiles (
        user_id,
        designation,
        is_active
      )
      VALUES ($1, $2, TRUE)
      RETURNING *;
    `;

    const profile = await db.one(profileQuery, [
      user.id,
      data.designation || null,
    ]);

    // Assign roles
    for (const roleId of roleIds) {
      await db.none(
        `
        INSERT INTO user_roles (user_id, role_id, is_active)
        VALUES ($1, $2, TRUE)
        `,
        [user.id, roleId],
      );
    }

    // Assign centres
    for (const centreId of centreIds) {
      await db.none(
        `
        INSERT INTO centre_staff_assignments (centre_id, user_id, is_active)
        VALUES ($1, $2, TRUE)
        `,
        [centreId, user.id],
      );
    }

    return { user, profile };
  }

  /**
   * Update staff user profile
   */
  async updateStaffUser(userId: number, data: Partial<CreateStaffData>) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.full_name !== undefined) {
      fields.push(`full_name = $${paramIndex}`);
      values.push(data.full_name);
      paramIndex++;
    }

    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(data.email);
      paramIndex++;
    }

    if (data.phone !== undefined) {
      fields.push(`phone = $${paramIndex}`);
      values.push(data.phone);
      paramIndex++;
    }

    if (fields.length > 0) {
      fields.push("updated_at = NOW()");
      const query = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *;
      `;
      values.push(userId);
      await db.one(query, values);
    }

    // Update staff profile if designation is provided
    if (data.designation !== undefined) {
      await db.none(
        `
        UPDATE staff_profiles
        SET designation = $1, updated_at = NOW()
        WHERE user_id = $2
        `,
        [data.designation, userId],
      );
    }

    return this.findStaffById(userId);
  }

  /**
   * Delete staff user (soft delete by setting is_active = false)
   */
  async deleteStaffUser(userId: number) {
    await db.none("UPDATE users SET is_active = FALSE WHERE id = $1", [userId]);
    await db.none(
      "UPDATE staff_profiles SET is_active = FALSE WHERE user_id = $1",
      [userId],
    );
    await db.none(
      "UPDATE user_roles SET is_active = FALSE WHERE user_id = $1",
      [userId],
    );
  }

  async assignRole(
    userId: number,
    roleId: number,
    centreId?: number | null,
    isPrimary?: boolean,
  ) {
    const result = await db.one(
      `
      INSERT INTO user_roles (user_id, role_id, centre_id, is_primary, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING *;
      `,
      [userId, roleId, centreId || null, isPrimary || false],
    );

    return result;
  }

  async getStaffList() {
    const staff = await db.any(`
      SELECT u.id, u.full_name, u.phone, u.user_type, sp.designation, sp.is_active
      FROM users u
      JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE u.is_active = TRUE
      ORDER BY u.id DESC;
    `);
    return staff;
  }

  async getStaffById(userId: number) {
    const user = await db.oneOrNone(
      "SELECT * FROM users WHERE id = $1 AND user_type = 'STAFF'",
      [userId],
    );
    if (!user) return null;

    const profile = await db.one(
      "SELECT * FROM staff_profiles WHERE user_id = $1",
      [userId],
    );

    const roles = await db.any(
      `
      SELECT r.name 
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND ur.is_active = TRUE
      `,
      [userId],
    );

    const centres = await db.any(
      `
      SELECT ur.centre_id, c.name AS centre_name, r.name AS role_name
      FROM user_roles ur
      JOIN centres c ON c.id = ur.centre_id
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND ur.centre_id IS NOT NULL
      `,
      [userId],
    );

    return { user, profile, roles: roles.map((r) => r.name), centres };
  }

  /**
   * Find clinicians with centre and specialization filters
   */
  async findClinicians(filters?: ClinicianFilters) {
    const conditions: string[] = ["cp.is_active = TRUE", "u.is_active = TRUE"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.centreId) {
      conditions.push(`cp.primary_centre_id = $${paramIndex}`);
      params.push(filters.centreId);
      paramIndex++;
    }

    if (filters?.specialization) {
      conditions.push(`cp.specialization ILIKE $${paramIndex}`);
      params.push(`%${filters.specialization}%`);
      paramIndex++;
    }

    const query = `
      SELECT
        cp.id,
        cp.user_id,
        u.full_name,
        u.phone,
        u.email,
        cp.specialization,
        cp.registration_number,
        cp.experience_years,
        cp.consultation_fee,
        cp.primary_centre_id,
        c.name as centre_name,
        sp.profile_picture_url
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON cp.primary_centre_id = c.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.full_name ASC
    `;

    return db.any(query, params);
  }

  /**
   * Find clinician by ID with availability rules
   */
  async findClinicianById(clinicianId: number) {
    const query = `
      SELECT
        cp.*,
        u.full_name,
        u.phone,
        u.email,
        c.name as centre_name,
        c.city as centre_city,
        sp.profile_picture_url,
        sp.bio
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON cp.primary_centre_id = c.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE cp.id = $1 AND cp.is_active = TRUE
    `;

    const clinician = await db.oneOrNone(query, [clinicianId]);
    if (!clinician) return null;

    // Get availability rules
    const availabilityRules = await db.any(
      `
      SELECT *
      FROM clinician_availability_rules
      WHERE clinician_id = $1 AND is_active = TRUE
      ORDER BY day_of_week, start_time
      `,
      [clinicianId],
    );

    return { ...clinician, availabilityRules };
  }

  /**
   * Create clinician with clinician_profiles creation
   */
  async createClinician(data: CreateClinicianData) {
    const query = `
      INSERT INTO clinician_profiles (
        user_id,
        primary_centre_id,
        specialization,
        registration_number,
        years_of_experience,
        consultation_fee,
        bio,
        consultation_modes,
        default_consultation_duration_minutes,
        qualification,
        expertise,
        languages,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
      RETURNING *;
    `;

    // Convert arrays to JSONB
    const specialization = JSON.stringify(data.specialization);
    const consultationModes = data.consultation_modes
      ? JSON.stringify(data.consultation_modes)
      : null;
    const qualification = data.qualification
      ? JSON.stringify(data.qualification)
      : "[]";
    const expertise = data.expertise ? JSON.stringify(data.expertise) : "[]";
    const languages = data.languages
      ? JSON.stringify(data.languages)
      : '["English"]';

    const clinician = await db.one(query, [
      data.user_id,
      data.primary_centre_id,
      specialization,
      data.registration_number || null,
      data.years_of_experience || 0,
      data.consultation_fee || 0,
      data.bio || null,
      consultationModes,
      data.default_consultation_duration_minutes || 30,
      qualification,
      expertise,
      languages,
    ]);

    // Update staff profile with profile picture if provided
    if (data.profile_picture_url) {
      await db.none(
        `UPDATE staff_profiles 
         SET profile_picture_url = $1, updated_at = NOW() 
         WHERE user_id = $2`,
        [data.profile_picture_url, data.user_id],
      );
    }

    return clinician;
  }

  /**
   * Update clinician profile
   */
  async updateClinician(
    clinicianId: number,
    data: Partial<CreateClinicianData>,
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.primary_centre_id !== undefined) {
      fields.push(`primary_centre_id = $${paramIndex}`);
      values.push(data.primary_centre_id);
      paramIndex++;
    }

    if (data.specialization !== undefined) {
      fields.push(`specialization = $${paramIndex}`);
      values.push(JSON.stringify(data.specialization));
      paramIndex++;
    }

    if (data.registration_number !== undefined) {
      fields.push(`registration_number = $${paramIndex}`);
      values.push(data.registration_number);
      paramIndex++;
    }

    if (data.years_of_experience !== undefined) {
      fields.push(`years_of_experience = $${paramIndex}`);
      values.push(data.years_of_experience);
      paramIndex++;
    }

    if (data.consultation_fee !== undefined) {
      fields.push(`consultation_fee = $${paramIndex}`);
      values.push(data.consultation_fee);
      paramIndex++;
    }

    if (data.bio !== undefined) {
      fields.push(`bio = $${paramIndex}`);
      values.push(data.bio);
      paramIndex++;
    }

    if (data.consultation_modes !== undefined) {
      fields.push(`consultation_modes = $${paramIndex}`);
      values.push(JSON.stringify(data.consultation_modes));
      paramIndex++;
    }

    if (data.default_consultation_duration_minutes !== undefined) {
      fields.push(`default_consultation_duration_minutes = $${paramIndex}`);
      values.push(data.default_consultation_duration_minutes);
      paramIndex++;
    }

    if (data.qualification !== undefined) {
      fields.push(`qualification = $${paramIndex}`);
      values.push(JSON.stringify(data.qualification));
      paramIndex++;
    }

    if (data.expertise !== undefined) {
      fields.push(`expertise = $${paramIndex}`);
      values.push(JSON.stringify(data.expertise));
      paramIndex++;
    }

    if (data.languages !== undefined) {
      fields.push(`languages = $${paramIndex}`);
      values.push(JSON.stringify(data.languages));
      paramIndex++;
    }

    if (fields.length === 0 && !data.profile_picture_url) {
      throw new Error("No fields to update");
    }

    if (fields.length > 0) {
      fields.push("updated_at = NOW()");

      const query = `
        UPDATE clinician_profiles
        SET ${fields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *;
      `;

      values.push(clinicianId);
      await db.one(query, values);
    }

    // Update profile picture in staff_profiles if provided
    if (data.profile_picture_url !== undefined) {
      const clinician = await db.one(
        "SELECT user_id FROM clinician_profiles WHERE id = $1",
        [clinicianId],
      );
      await db.none(
        `UPDATE staff_profiles 
         SET profile_picture_url = $1, updated_at = NOW() 
         WHERE user_id = $2`,
        [data.profile_picture_url, clinician.user_id],
      );
    }

    return this.findClinicianById(clinicianId);
  }

  /**
   * Delete clinician with future appointment check
   */
  async deleteClinician(clinicianId: number) {
    // Check for future appointments
    const futureAppointments = await db.oneOrNone(
      `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE clinician_id = $1
        AND scheduled_start_at > NOW()
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND is_active = TRUE
      `,
      [clinicianId],
    );

    if (futureAppointments && parseInt(futureAppointments.count) > 0) {
      throw new Error(
        "Cannot delete clinician with future appointments. Please cancel or reassign appointments first.",
      );
    }

    // Soft delete
    await db.none(
      "UPDATE clinician_profiles SET is_active = FALSE WHERE id = $1",
      [clinicianId],
    );
  }

  /**
   * Update clinician availability rules
   */
  async updateClinicianAvailability(
    clinicianId: number,
    rules: AvailabilityRule[],
  ) {
    // Delete existing rules
    await db.none(
      "DELETE FROM clinician_availability_rules WHERE clinician_id = $1",
      [clinicianId],
    );

    // Insert new rules
    for (const rule of rules) {
      await db.none(
        `
        INSERT INTO clinician_availability_rules (
          clinician_id,
          centre_id,
          day_of_week,
          start_time,
          end_time,
          slot_duration_minutes,
          mode,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        `,
        [
          clinicianId,
          rule.centre_id,
          rule.day_of_week,
          rule.start_time,
          rule.end_time,
          rule.slot_duration_minutes,
          rule.consultation_mode,
        ],
      );
    }

    return this.findClinicianById(clinicianId);
  }

  /**
   * Toggle clinician active status
   */
  async toggleClinicianActive(clinicianId: number, isActive: boolean) {
    await db.none(
      `UPDATE clinician_profiles 
       SET is_active = $1, updated_at = NOW() 
       WHERE id = $2`,
      [isActive, clinicianId],
    );

    return this.findClinicianById(clinicianId);
  }

  /**
   * Toggle staff active status (for all staff types)
   */
  async toggleStaffActive(userId: number, isActive: boolean) {
    await db.none(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2`,
      [isActive, userId],
    );

    await db.none(
      `UPDATE staff_profiles
       SET is_active = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [isActive, userId],
    );

    return this.findStaffById(userId);
  }
}

export const staffRepository = new StaffRepository();
