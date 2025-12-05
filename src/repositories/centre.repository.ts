// src/repositories/centre.repository.ts
import { db } from "../config/db";

interface Centre {
  id: number;
  name: string;
  city: string;
  address_line1: string;
  address_line2: string | null;
  pincode: string;
  contact_phone: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class CentreRepository {
  /**
   * Find all centres with optional city filter
   */
  async findCentres(city?: string): Promise<Centre[]> {
    const cityFilter = city
      ? "WHERE city = $1 AND is_active = TRUE"
      : "WHERE is_active = TRUE";
    const params = city ? [city] : [];

    const query = `
      SELECT *
      FROM centres
      ${cityFilter}
      ORDER BY name ASC
    `;

    return db.any<Centre>(query, params);
  }

  /**
   * Find centre by ID
   */
  async findCentreById(id: number): Promise<Centre | null> {
    const query = `
      SELECT *
      FROM centres
      WHERE id = $1 AND is_active = TRUE
    `;

    return db.oneOrNone<Centre>(query, [id]);
  }

  /**
   * Create new centre
   */
  async createCentre(data: {
    name: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    pincode: string;
    contactPhone: string;
  }): Promise<Centre> {
    const query = `
      INSERT INTO centres (name, city, address_line1, address_line2, pincode, contact_phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING *
    `;

    return db.one<Centre>(query, [
      data.name,
      data.city,
      data.addressLine1,
      data.addressLine2 || null,
      data.pincode,
      data.contactPhone,
    ]);
  }

  /**
   * Update centre
   */
  async updateCentre(
    id: number,
    data: {
      name?: string;
      city?: string;
      addressLine1?: string;
      addressLine2?: string;
      pincode?: string;
      contactPhone?: string;
    }
  ): Promise<Centre> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(data.city);
    }
    if (data.addressLine1 !== undefined) {
      updates.push(`address_line1 = $${paramIndex++}`);
      values.push(data.addressLine1);
    }
    if (data.addressLine2 !== undefined) {
      updates.push(`address_line2 = $${paramIndex++}`);
      values.push(data.addressLine2);
    }
    if (data.pincode !== undefined) {
      updates.push(`pincode = $${paramIndex++}`);
      values.push(data.pincode);
    }
    if (data.contactPhone !== undefined) {
      updates.push(`contact_phone = $${paramIndex++}`);
      values.push(data.contactPhone);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE centres
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex} AND is_active = TRUE
      RETURNING *
    `;

    return db.one<Centre>(query, values);
  }

  /**
   * Delete centre (soft delete)
   */
  async deleteCentre(id: number): Promise<void> {
    const query = `
      UPDATE centres
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
    `;

    await db.none(query, [id]);
  }
}

export const centreRepository = new CentreRepository();
