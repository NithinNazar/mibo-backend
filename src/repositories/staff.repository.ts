// src/repositories/staff.repository.ts
import { db } from "../config/db";
import { hashPassword } from "../utils/password";

interface StaffFilters {
  roleId?: number;
  centreId?: number;
  isActive?: boolean;
}

interface ClinicianFilters {
  centreId?: number;
  specialization?: string;
  isActive?: boolean;
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
  phone?: string;
  email?: string;
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
  centre_id?: number; // Required: which centre this availability applies to
  id?: string; // Optional ID for existing rules (used in updates)
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  consultationMode: string;
  slotDurationMinutes?: number;
}

export class StaffRepository {
  /**
   * Find staff users with role and centre filters
   */
  async findStaffUsers(filters?: StaffFilters) {
    const conditions: string[] = ["u.user_type = 'STAFF'"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.isActive !== undefined) {
      conditions.push(`u.is_active = $${paramIndex}`);
      conditions.push(`sp.is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

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
        sp.is_active AS "isActive",
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
  async findStaffById(userId: number, isActive?: boolean) {
    const conditions = ["u.id = $1", "u.user_type = 'STAFF'"];
    const params: any[] = [userId];

    if (isActive !== undefined) {
      conditions.push("u.is_active = $2");
      params.push(isActive);
    }

    const query = `
      SELECT
        u.*,
        sp.designation,
        sp.profile_picture_url
      FROM users u
      JOIN staff_profiles sp ON sp.user_id = u.id
      WHERE ${conditions.join(" AND ")}
    `;

    const user = await db.oneOrNone(query, params);
    if (!user) return null;

    // Get roles
    const roles = await db.any(
      `
      SELECT r.id, r.name, ur.centre_id
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

    // Use transaction to ensure data consistency
    return await db.tx(async (t) => {
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

      const user = await t.one(userQuery, [
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

      const profile = await t.one(profileQuery, [
        user.id,
        data.designation || null,
      ]);

      // Assign roles with centre_id
      // If centres are provided, assign each role with the corresponding centre
      // Otherwise, assign roles without centre (for roles like MANAGER that don't need centres)
      if (centreIds.length > 0) {
        for (let i = 0; i < roleIds.length; i++) {
          const roleId = roleIds[i];
          const centreId = centreIds[i] || centreIds[0]; // Use corresponding centre or first centre
          await t.none(
            `
            INSERT INTO user_roles (user_id, role_id, centre_id, is_active)
            VALUES ($1, $2, $3, TRUE)
            `,
            [user.id, roleId, centreId],
          );
        }
      } else {
        // No centres provided (e.g., for MANAGER role)
        for (const roleId of roleIds) {
          await t.none(
            `
            INSERT INTO user_roles (user_id, role_id, is_active)
            VALUES ($1, $2, TRUE)
            `,
            [user.id, roleId],
          );
        }
      }

      // Assign centres to centre_staff_assignments table
      for (let i = 0; i < centreIds.length; i++) {
        const centreId = centreIds[i];
        const roleId = roleIds[i] || roleIds[0]; // Use corresponding role or first role
        await t.none(
          `
          INSERT INTO centre_staff_assignments (centre_id, user_id, role_id, is_active)
          VALUES ($1, $2, $3, TRUE)
          `,
          [centreId, user.id, roleId],
        );
      }

      return { user, profile };
    });
  }

  /**
   * Update staff user profile
   */
  async updateStaffUser(
    userId: number,
    data: Partial<CreateStaffData> & { centre_ids?: number[] },
  ) {
    return await db.tx(async (t) => {
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
        values.push(data.email || null);
        paramIndex++;
      }

      if (data.phone !== undefined) {
        fields.push(`phone = $${paramIndex}`);
        values.push(data.phone);
        paramIndex++;
      }

      if (data.username !== undefined) {
        fields.push(`username = $${paramIndex}`);
        values.push(data.username);
        paramIndex++;
      }

      if (data.password !== undefined) {
        const passwordHash = await hashPassword(data.password);
        fields.push(`password_hash = $${paramIndex}`);
        values.push(passwordHash);
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
        await t.one(query, values);
      }

      // Update staff profile if designation is provided
      if (data.designation !== undefined) {
        await t.none(
          `
          UPDATE staff_profiles
          SET designation = $1, updated_at = NOW()
          WHERE user_id = $2
          `,
          [data.designation, userId],
        );
      }

      // Update centre assignments if provided
      if (data.centre_ids && Array.isArray(data.centre_ids)) {
        // Get current role_id for this user
        const currentRole = await t.oneOrNone(
          `SELECT role_id FROM user_roles WHERE user_id = $1 AND is_active = TRUE LIMIT 1`,
          [userId],
        );

        if (currentRole) {
          // Deactivate old centre assignments
          await t.none(
            `UPDATE centre_staff_assignments SET is_active = FALSE WHERE user_id = $1`,
            [userId],
          );

          // Add new centre assignments
          for (const centreId of data.centre_ids) {
            await t.none(
              `
              INSERT INTO centre_staff_assignments (centre_id, user_id, role_id, is_active)
              VALUES ($1, $2, $3, TRUE)
              ON CONFLICT (centre_id, user_id, role_id) 
              DO UPDATE SET is_active = TRUE, updated_at = NOW()
              `,
              [centreId, userId, currentRole.role_id],
            );
          }
        }
      }

      return await this.findStaffById(userId);
    });
  }

  /**
   * Delete staff user (soft delete by setting is_active = false)
   */
  async deleteStaffUser(userId: number) {
    // Use transaction to ensure data consistency
    await db.tx(async (t) => {
      await t.none("UPDATE users SET is_active = FALSE WHERE id = $1", [
        userId,
      ]);
      await t.none(
        "UPDATE staff_profiles SET is_active = FALSE WHERE user_id = $1",
        [userId],
      );
      await t.none(
        "UPDATE user_roles SET is_active = FALSE WHERE user_id = $1",
        [userId],
      );
    });
  }

  async assignRole(
    userId: number,
    roleId: number,
    centreId?: number | null,
    isPrimary?: boolean,
  ) {
    const result = await db.one(
      `
      INSERT INTO user_roles (user_id, role_id, centre_id, is_active)
      VALUES ($1, $2, $3, TRUE)
      RETURNING *;
      `,
      [userId, roleId, centreId || null],
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
    const conditions: string[] = [];
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

    if (filters?.isActive !== undefined) {
      conditions.push(`cp.is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        cp.*,
        u.full_name,
        u.phone,
        u.email,
        c.name as primary_centre_name,
        sp.profile_picture_url,
        sp.designation,
        COALESCE(ar.availability_rules, '[]'::json) AS availability_rules
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON cp.primary_centre_id = c.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN (
        SELECT clinician_id, json_agg(row_to_json(ar.*)) AS availability_rules
        FROM (
          SELECT *
          FROM clinician_availability_rules
          WHERE is_active = TRUE
        ) ar
        GROUP BY clinician_id
      ) ar ON ar.clinician_id = cp.id
      ${whereClause}
      ORDER BY u.full_name ASC
    `;

    return db.any(query, params);
  }

  /**
   * Find clinician by ID with availability rules
   * @param clinicianId - Clinician ID
   * @param isActive - Optional filter: undefined (all), true (active only), false (inactive only)
   */
  async findClinicianById(clinicianId: number, isActive?: boolean) {
    const conditions = ["cp.id = $1"];

    if (isActive !== undefined) {
      conditions.push(`cp.is_active = ${isActive}`);
    }

    const query = `
      SELECT
        cp.*,
        u.full_name,
        u.phone,
        u.email,
        u.username,
        c.name as primary_centre_name,
        c.city as centre_city,
        sp.profile_picture_url
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON cp.primary_centre_id = c.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE ${conditions.join(" AND ")}
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
    // Use transaction to ensure data consistency
    return await db.tx(async (t) => {
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

      const clinician = await t.one(query, [
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
        await t.none(
          `UPDATE staff_profiles 
           SET profile_picture_url = $1, updated_at = NOW() 
           WHERE user_id = $2`,
          [data.profile_picture_url, data.user_id],
        );
      }

      return clinician;
    });
  }

  /**
   * Update clinician profile
   */
  async updateClinician(
    clinicianId: number,
    data: Partial<CreateClinicianData>,
  ) {
    return await db.tx(async (t) => {
      // Get clinician's user_id first
      const clinician = await t.one(
        "SELECT user_id FROM clinician_profiles WHERE id = $1",
        [clinicianId],
      );

      // Update user fields (phone, email) if provided
      const userFields: string[] = [];
      const userValues: any[] = [];
      let userParamIndex = 1;

      if (data.phone !== undefined) {
        userFields.push(`phone = $${userParamIndex}`);
        userValues.push(data.phone);
        userParamIndex++;
      }

      if (data.email !== undefined) {
        userFields.push(`email = $${userParamIndex}`);
        userValues.push(data.email || null);
        userParamIndex++;
      }

      if (userFields.length > 0) {
        userFields.push("updated_at = NOW()");
        const userQuery = `
          UPDATE users
          SET ${userFields.join(", ")}
          WHERE id = $${userParamIndex}
        `;
        userValues.push(clinician.user_id);
        await t.none(userQuery, userValues);
      }

      // Update clinician profile fields
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
        // Only user fields were updated, return success
        if (userFields.length > 0) {
          return await this.findClinicianById(clinicianId);
        }
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
        await t.one(query, values);
      }

      // Update profile picture in staff_profiles if provided
      if (data.profile_picture_url !== undefined) {
        const clinicianData = await t.one(
          "SELECT user_id FROM clinician_profiles WHERE id = $1",
          [clinicianId],
        );
        await t.none(
          `UPDATE staff_profiles 
           SET profile_picture_url = $1, updated_at = NOW() 
           WHERE user_id = $2`,
          [data.profile_picture_url, clinicianData.user_id],
        );
      }

      return await this.findClinicianById(clinicianId);
    });
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
   * Smart update: only modifies changed rules, preserves existing ones
   */
  async updateClinicianAvailability(
    clinicianId: number,
    rules: AvailabilityRule[],
    centreId: number,
  ) {
    return await db.tx(async (t) => {
      // Get existing rules for this clinician
      const existingRules = await t.any(
        `SELECT id, centre_id, day_of_week, start_time, end_time, mode
         FROM clinician_availability_rules 
         WHERE clinician_id = $1 AND is_active = TRUE`,
        [clinicianId],
      );

      // Create a map of existing rules for comparison
      const existingRulesMap = new Map(
        existingRules.map((r: any) => [
          `${r.centre_id}-${r.day_of_week}-${r.start_time}-${r.end_time}-${r.mode}`,
          r.id,
        ]),
      );

      // Track which existing rules should be kept
      const rulesToKeep = new Set<number>();

      // Process incoming rules
      for (const rule of rules) {
        const [startHour, startMin] = rule.startTime.split(":").map(Number);
        const [endHour, endMin] = rule.endTime.split(":").map(Number);
        const slotDuration =
          endHour * 60 + endMin - (startHour * 60 + startMin);

        const ruleKey = `${rule.centre_id || centreId}-${rule.dayOfWeek}-${rule.startTime}-${rule.endTime}-${rule.consultationMode}`;

        // Check if this rule already exists
        const existingRuleId = existingRulesMap.get(ruleKey);

        if (existingRuleId !== undefined) {
          // Rule exists, mark it to keep
          rulesToKeep.add(existingRuleId as number);
        } else {
          // New rule, insert it
          await t.none(
            `INSERT INTO clinician_availability_rules (
              clinician_id, centre_id, day_of_week, start_time, end_time,
              slot_duration_minutes, mode, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
            [
              clinicianId,
              rule.centre_id || centreId,
              rule.dayOfWeek,
              rule.startTime,
              rule.endTime,
              rule.slotDurationMinutes || slotDuration,
              rule.consultationMode,
            ],
          );
        }
      }

      // Delete rules that are no longer present (soft delete by setting is_active = FALSE)
      const ruleIdsToDelete = existingRules
        .filter((r: any) => !rulesToKeep.has(r.id))
        .map((r: any) => r.id);

      if (ruleIdsToDelete.length > 0) {
        await t.none(
          `UPDATE clinician_availability_rules 
           SET is_active = FALSE 
           WHERE id = ANY($1::int[])`,
          [ruleIdsToDelete],
        );
      }

      return this.findClinicianById(clinicianId);
    });
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
   * Delete a specific availability rule (hard delete)
   */
  async deleteAvailabilityRule(clinicianId: number, ruleId: number) {
    // Verify the rule belongs to this clinician
    const rule = await db.oneOrNone(
      `SELECT id FROM clinician_availability_rules 
       WHERE id = $1 AND clinician_id = $2`,
      [ruleId, clinicianId],
    );

    if (!rule) {
      throw new Error(
        "Availability rule not found or does not belong to this clinician",
      );
    }

    // Hard delete the rule
    await db.none(`DELETE FROM clinician_availability_rules WHERE id = $1`, [
      ruleId,
    ]);
  }

  /**
   * Delete all availability rules for a specific day of week (hard delete)
   */
  async deleteAvailabilityRulesByDay(
    clinicianId: number,
    dayOfWeek: number,
    centreId?: number,
  ) {
    const conditions = [
      "clinician_id = $1",
      "day_of_week = $2",
      "is_active = TRUE",
    ];
    const params: any[] = [clinicianId, dayOfWeek];
    let paramIndex = 3;

    if (centreId) {
      conditions.push(`centre_id = $${paramIndex}`);
      params.push(centreId);
      paramIndex++;
    }

    // Get rules to be deleted for logging
    const rulesToDelete = await db.any(
      `SELECT id, day_of_week, start_time, end_time, mode
       FROM clinician_availability_rules
       WHERE ${conditions.join(" AND ")}`,
      params,
    );

    if (rulesToDelete.length === 0) {
      throw new Error(`No availability rules found for day ${dayOfWeek}`);
    }

    // Hard delete all rules for this day
    await db.none(
      `DELETE FROM clinician_availability_rules
       WHERE ${conditions.join(" AND ")}`,
      params,
    );

    return {
      deletedCount: rulesToDelete.length,
      deletedRules: rulesToDelete,
    };
  }

  /**
   * Get availability rules grouped by day of week
   */
  async getAvailabilityRulesByDay(clinicianId: number, centreId?: number) {
    const conditions = ["clinician_id = $1", "is_active = TRUE"];
    const params: any[] = [clinicianId];
    let paramIndex = 2;

    if (centreId) {
      conditions.push(`centre_id = $${paramIndex}`);
      params.push(centreId);
      paramIndex++;
    }

    const rules = await db.any(
      `SELECT day_of_week, start_time, end_time, mode, centre_id, COUNT(*) as slot_count
       FROM clinician_availability_rules
       WHERE ${conditions.join(" AND ")}
       GROUP BY day_of_week, start_time, end_time, mode, centre_id
       ORDER BY day_of_week, start_time`,
      params,
    );

    // Group by day of week
    const rulesByDay: { [key: number]: any[] } = {};
    rules.forEach((rule: any) => {
      if (!rulesByDay[rule.day_of_week]) {
        rulesByDay[rule.day_of_week] = [];
      }
      rulesByDay[rule.day_of_week].push(rule);
    });

    return rulesByDay;
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
  /**
   * Get booked appointments for a clinician on a specific date
   */
  async getBookedAppointments(
    clinicianId: number,
    date: string,
    centreId?: number,
  ) {
    const conditions: string[] = [
      "a.clinician_id = $1",
      "DATE(a.scheduled_start_at) = $2",
      "a.status NOT IN ('CANCELLED', 'NO_SHOW')",
      "a.is_active = TRUE",
    ];
    const params: any[] = [clinicianId, date];
    let paramIndex = 3;

    if (centreId) {
      conditions.push(`a.centre_id = ${paramIndex}`);
      params.push(centreId);
      paramIndex++;
    }

    const query = `
      SELECT
        a.id,
        a.scheduled_start_at,
        a.scheduled_end_at,
        a.appointment_type as mode
      FROM appointments a
      WHERE ${conditions.join(" AND ")}
      ORDER BY a.scheduled_start_at ASC
    `;

    return db.any(query, params);
  }

  /**
   * Create a slot exception (block a specific slot without deleting the rule)
   */
  async createSlotException(
    clinicianId: number,
    centreId: number,
    exceptionDate: string,
    startTime: string,
    endTime: string,
    mode: string,
    reason?: string,
    createdByUserId?: number,
  ) {
    const query = `
      INSERT INTO clinician_slot_exceptions (
        clinician_id,
        centre_id,
        exception_date,
        start_time,
        end_time,
        mode,
        reason,
        created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (clinician_id, centre_id, exception_date, start_time, mode)
      DO UPDATE SET
        end_time = EXCLUDED.end_time,
        reason = EXCLUDED.reason,
        updated_at = NOW()
      RETURNING *;
    `;

    return db.one(query, [
      clinicianId,
      centreId,
      exceptionDate,
      startTime,
      endTime,
      mode,
      reason || null,
      createdByUserId || null,
    ]);
  }

  /**
   * Get slot exceptions for a clinician within a date range
   */
  async getSlotExceptions(
    clinicianId: number,
    startDate: string,
    endDate: string,
    centreId?: number,
  ) {
    const conditions: string[] = [
      "clinician_id = $1",
      "exception_date >= $2",
      "exception_date <= $3",
    ];
    const params: any[] = [clinicianId, startDate, endDate];
    let paramIndex = 4;

    if (centreId) {
      conditions.push(`centre_id = ${paramIndex}`);
      params.push(centreId);
      paramIndex++;
    }

    const query = `
      SELECT *
      FROM clinician_slot_exceptions
      WHERE ${conditions.join(" AND ")}
      ORDER BY exception_date, start_time
    `;

    return db.any(query, params);
  }

  /**
   * Check if a specific slot has an exception (is blocked)
   */
  async hasSlotException(
    clinicianId: number,
    centreId: number,
    date: string,
    startTime: string,
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM clinician_slot_exceptions
      WHERE clinician_id = $1
        AND centre_id = $2
        AND exception_date = $3
        AND start_time = $4
    `;

    const result = await db.one<{ count: string }>(query, [
      clinicianId,
      centreId,
      date,
      startTime,
    ]);

    return parseInt(result.count) > 0;
  }

  /**
   * Delete a slot exception (unblock a specific slot)
   */
  async deleteSlotException(exceptionId: number, clinicianId: number) {
    // Verify the exception belongs to this clinician
    const exception = await db.oneOrNone(
      `SELECT id FROM clinician_slot_exceptions 
       WHERE id = $1 AND clinician_id = $2`,
      [exceptionId, clinicianId],
    );

    if (!exception) {
      throw new Error(
        "Slot exception not found or does not belong to this clinician",
      );
    }

    // Delete the exception
    await db.none(`DELETE FROM clinician_slot_exceptions WHERE id = $1`, [
      exceptionId,
    ]);
  }

  /**
   * Check if a specific slot is blocked by an exception
   */
  async isSlotBlocked(
    clinicianId: number,
    centreId: number,
    date: string,
    startTime: string,
    mode: string,
  ): Promise<boolean> {
    const result = await db.oneOrNone(
      `SELECT id FROM clinician_slot_exceptions
       WHERE clinician_id = $1
         AND centre_id = $2
         AND exception_date = $3
         AND start_time = $4
         AND mode = $5`,
      [clinicianId, centreId, date, startTime, mode],
    );

    return result !== null;
  }
}

export const staffRepository = new StaffRepository();
