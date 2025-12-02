// src/repositories/patient.repository.ts
import { db } from "../config/db";
import { User } from "../types/user.types";

export class PatientRepository {
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

  async createPatient(phone: string, fullName: string) {
    const user = await db.one(
      `
      INSERT INTO users (phone, full_name, user_type, is_active)
      VALUES ($1, $2, 'PATIENT', TRUE)
      RETURNING *;
      `,
      [phone, fullName]
    );

    const profile = await db.one(
      `
      INSERT INTO patient_profiles (user_id, is_active)
      VALUES ($1, TRUE)
      RETURNING *;
      `,
      [user.id]
    );

    return { user, profile };
  }
}

export const patientRepository = new PatientRepository();
