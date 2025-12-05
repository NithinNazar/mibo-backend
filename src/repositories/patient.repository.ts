// src/repositories/patient.repository.ts
import { db } from "../config/db";
import { User } from "../types/user.types";

interface PatientProfile {
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

interface CreatePatientData {
  phone: string;
  full_name: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export class PatientRepository {
  /**
   * Find patients with search filters (name, phone)
   */
  async findPatients(search?: string, phone?: string) {
    const conditions: string[] = [
      "u.user_type = 'PATIENT'",
      "u.is_active = TRUE",
      "pp.is_active = TRUE",
    ];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`u.full_name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (phone) {
      conditions.push(`u.phone LIKE $${paramIndex}`);
      params.push(`%${phone}%`);
      paramIndex++;
    }

    const query = `
      SELECT
        pp.id,
        u.id as user_id,
        u.full_name,
        u.phone,
        u.email,
        pp.date_of_birth,
        pp.gender,
        pp.blood_group,
        pp.created_at,
        pp.updated_at
      FROM patient_profiles pp
      JOIN users u ON pp.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY u.full_name ASC
    `;

    return db.any(query, params);
  }
  async findByUserId(userId: number) {
    const user = await db.oneOrNone<User>(
      "SELECT * FROM users WHERE id = $1 AND user_type = 'PATIENT' AND is_active = TRUE",
      [userId]
    );
    if (!user) return null;

    const profile = await db.oneOrNone(
      "SELECT * FROM patient_profiles WHERE user_id = $1 AND is_active = TRUE",
      [userId]
    );

    return { user, profile };
  }

  /**
   * Find patient by ID with user details
   */
  async findPatientById(patientId: number) {
    const query = `
      SELECT
        pp.*,
        u.full_name,
        u.phone,
        u.email,
        u.created_at as user_created_at
      FROM patient_profiles pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.id = $1
        AND pp.is_active = TRUE
        AND u.is_active = TRUE
    `;

    return db.oneOrNone(query, [patientId]);
  }

  async findById(patientId: number) {
    const profile = await db.oneOrNone(
      "SELECT * FROM patient_profiles WHERE id = $1 AND is_active = TRUE",
      [patientId]
    );
    if (!profile) return null;

    const user = await db.one(
      "SELECT * FROM users WHERE id = $1 AND user_type = 'PATIENT'",
      [profile.user_id]
    );

    return { user, profile };
  }

  async updatePatient(userId: number, data: any) {
    const fields = Object.keys(data);
    const values = Object.values(data);

    const updates = fields.map((key, idx) => `${key} = $${idx + 1}`).join(", ");

    const query = `
      UPDATE patient_profiles
      SET ${updates}, updated_at = NOW()
      WHERE user_id = $${fields.length + 1}
      RETURNING *;
    `;

    const updated = await db.one(query, [...values, userId]);
    return updated;
  }

  /**
   * Create patient with user and patient_profile creation
   */
  async createPatient(data: CreatePatientData) {
    // Create user record
    const userQuery = `
      INSERT INTO users (phone, full_name, email, user_type, is_active)
      VALUES ($1, $2, $3, 'PATIENT', TRUE)
      RETURNING *;
    `;

    const user = await db.one<User>(userQuery, [
      data.phone,
      data.full_name,
      data.email || null,
    ]);

    // Create patient profile
    const profileQuery = `
      INSERT INTO patient_profiles (
        user_id,
        date_of_birth,
        gender,
        blood_group,
        emergency_contact_name,
        emergency_contact_phone,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING *;
    `;

    const profile = await db.one<PatientProfile>(profileQuery, [
      user.id,
      data.date_of_birth || null,
      data.gender || null,
      data.blood_group || null,
      data.emergency_contact_name || null,
      data.emergency_contact_phone || null,
    ]);

    return { user, profile };
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(patientId: number, data: Partial<PatientProfile>) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.date_of_birth !== undefined) {
      fields.push(`date_of_birth = $${paramIndex}`);
      values.push(data.date_of_birth);
      paramIndex++;
    }

    if (data.gender !== undefined) {
      fields.push(`gender = $${paramIndex}`);
      values.push(data.gender);
      paramIndex++;
    }

    if (data.blood_group !== undefined) {
      fields.push(`blood_group = $${paramIndex}`);
      values.push(data.blood_group);
      paramIndex++;
    }

    if (data.emergency_contact_name !== undefined) {
      fields.push(`emergency_contact_name = $${paramIndex}`);
      values.push(data.emergency_contact_name);
      paramIndex++;
    }

    if (data.emergency_contact_phone !== undefined) {
      fields.push(`emergency_contact_phone = $${paramIndex}`);
      values.push(data.emergency_contact_phone);
      paramIndex++;
    }

    if (data.notes !== undefined) {
      fields.push(`notes = $${paramIndex}`);
      values.push(data.notes);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    fields.push("updated_at = NOW()");

    const query = `
      UPDATE patient_profiles
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    values.push(patientId);

    return db.one<PatientProfile>(query, values);
  }

  /**
   * Get patient appointments with appointment history
   */
  async getPatientAppointments(patientId: number) {
    const query = `
      SELECT
        a.*,
        u_clinician.full_name as clinician_name,
        cp.specialization as clinician_specialization,
        c.name as centre_name
      FROM appointments a
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u_clinician ON cp.user_id = u_clinician.id
      JOIN centres c ON a.centre_id = c.id
      WHERE a.patient_id = $1
        AND a.is_active = TRUE
      ORDER BY a.scheduled_start_at DESC
    `;

    return db.any(query, [patientId]);
  }

  /**
   * Get patient payments with payment history
   */
  async getPatientPayments(patientId: number) {
    const query = `
      SELECT
        p.*,
        a.appointment_type,
        a.scheduled_start_at
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      WHERE p.patient_id = $1
      ORDER BY p.created_at DESC
    `;

    return db.any(query, [patientId]);
  }

  /**
   * Add medical note to patient_medical_notes table
   */
  async addMedicalNote(patientId: number, note: string, authorUserId: number) {
    const query = `
      INSERT INTO patient_medical_notes (
        patient_id,
        note,
        author_user_id,
        created_at
      )
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;

    return db.one(query, [patientId, note, authorUserId]);
  }

  /**
   * Check if phone exists to prevent duplicates
   */
  async checkPhoneExists(phone: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE phone = $1
        AND user_type = 'PATIENT'
        AND is_active = TRUE
    `;

    const result = await db.one<{ count: string }>(query, [phone]);
    return parseInt(result.count) > 0;
  }
}

export const patientRepository = new PatientRepository();
