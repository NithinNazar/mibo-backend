// src/repositories/staff.repository.ts
import { db } from "../config/db";

export class StaffRepository {
  async createStaffUser(fullName: string, phone: string, designation?: string) {
    const user = await db.one(
      `
      INSERT INTO users (full_name, phone, user_type, is_active)
      VALUES ($1, $2, 'STAFF', TRUE)
      RETURNING *;
      `,
      [fullName, phone]
    );

    const profile = await db.one(
      `
      INSERT INTO staff_profiles (user_id, designation, is_active)
      VALUES ($1, $2, TRUE)
      RETURNING *;
      `,
      [user.id, designation || null]
    );

    return { user, profile };
  }

  async assignRole(
    userId: number,
    roleId: number,
    centreId?: number | null,
    isPrimary?: boolean
  ) {
    const result = await db.one(
      `
      INSERT INTO user_roles (user_id, role_id, centre_id, is_primary, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING *;
      `,
      [userId, roleId, centreId || null, isPrimary || false]
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
      [userId]
    );
    if (!user) return null;

    const profile = await db.one(
      "SELECT * FROM staff_profiles WHERE user_id = $1",
      [userId]
    );

    const roles = await db.any(
      `
      SELECT r.name 
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND ur.is_active = TRUE
      `,
      [userId]
    );

    const centres = await db.any(
      `
      SELECT ur.centre_id, c.name AS centre_name, r.name AS role_name
      FROM user_roles ur
      JOIN centres c ON c.id = ur.centre_id
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND ur.centre_id IS NOT NULL
      `,
      [userId]
    );

    return { user, profile, roles: roles.map((r) => r.name), centres };
  }

  async deactivateStaff(userId: number) {
    await db.none("UPDATE users SET is_active = FALSE WHERE id = $1", [userId]);
    await db.none(
      "UPDATE staff_profiles SET is_active = FALSE WHERE user_id = $1",
      [userId]
    );
    await db.none(
      "UPDATE user_roles SET is_active = FALSE WHERE user_id = $1",
      [userId]
    );
  }
}

export const staffRepository = new StaffRepository();
