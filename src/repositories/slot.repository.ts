// src/repositories/slot.repository.ts
import { db } from "../config/db";
import {
  BlockedSlot,
  BlockSlotRequest,
  BlockedSlotFilters,
} from "../types/slot-blocking.types";

export class SlotRepository {
  /**
   * Find a blocked slot by ID
   */
  async findSlotById(slotId: number): Promise<BlockedSlot | null> {
    const query = `
      SELECT *
      FROM blocked_slots
      WHERE id = $1
    `;
    return db.oneOrNone<BlockedSlot>(query, [slotId]);
  }

  /**
   * Find multiple blocked slots by IDs
   */
  async findSlotsByIds(slotIds: number[]): Promise<BlockedSlot[]> {
    if (slotIds.length === 0) {
      return [];
    }

    const query = `
      SELECT *
      FROM blocked_slots
      WHERE id = ANY($1::int[])
    `;
    return db.any<BlockedSlot>(query, [slotIds]);
  }

  /**
   * Find all slots for a clinician on a specific date
   * This queries the existing slots/availability system to find what slots exist
   */
  async findSlotsByClinicianAndDate(
    clinicianId: number,
    date: string,
  ): Promise<Array<{ start_time: string; end_time: string }>> {
    // Get day of week from date (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(date).getDay();

    const query = `
      SELECT 
        start_time,
        end_time
      FROM clinician_availability_rules
      WHERE clinician_id = $1
        AND day_of_week = $2
        AND is_active = TRUE
      ORDER BY start_time ASC
    `;

    return db.any<{ start_time: string; end_time: string }>(query, [
      clinicianId,
      dayOfWeek,
    ]);
  }

  /**
   * Block a slot with database transaction and locking
   * Uses SELECT FOR UPDATE to prevent concurrent modifications
   */
  async blockSlot(
    clinicianId: number,
    centreId: number,
    date: string,
    startTime: string,
    endTime: string,
    adminId: number,
    reason: string = "Clinician unavailable",
  ): Promise<BlockedSlot> {
    return db.tx(async (t) => {
      // Check if slot exists (blocked or unblocked)
      const existingQuery = `
        SELECT *
        FROM blocked_slots
        WHERE clinician_id = $1
          AND centre_id = $2
          AND blocked_date = $3
          AND start_time = $4
          AND end_time = $5
        FOR UPDATE
      `;

      const existing = (await t.oneOrNone(existingQuery, [
        clinicianId,
        centreId,
        date,
        startTime,
        endTime,
      ])) as BlockedSlot | null;

      if (existing) {
        // If slot exists and is already blocked, throw error
        if (existing.is_blocked) {
          throw new Error("SLOT_ALREADY_BLOCKED");
        }

        // If slot exists but is unblocked, update it to blocked
        const updateQuery = `
          UPDATE blocked_slots
          SET is_blocked = TRUE,
              reason = $1,
              blocked_by_admin_id = $2,
              blocked_at = NOW(),
              updated_at = NOW(),
              unblocked_by_admin_id = NULL,
              unblocked_at = NULL
          WHERE id = $3
          RETURNING *
        `;

        return t.one(updateQuery, [
          reason,
          adminId,
          existing.id,
        ]) as Promise<BlockedSlot>;
      }

      // Insert new blocked slot if it doesn't exist
      const insertQuery = `
        INSERT INTO blocked_slots (
          clinician_id,
          centre_id,
          blocked_date,
          start_time,
          end_time,
          reason,
          blocked_by_admin_id,
          blocked_at,
          is_blocked
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), TRUE)
        RETURNING *
      `;

      return t.one(insertQuery, [
        clinicianId,
        centreId,
        date,
        startTime,
        endTime,
        reason,
        adminId,
      ]) as Promise<BlockedSlot>;
    });
  }

  /**
   * Unblock a slot
   */
  async unblockSlot(slotId: number, adminId: number): Promise<void> {
    const query = `
      UPDATE blocked_slots
      SET is_blocked = FALSE,
          unblocked_by_admin_id = $1,
          unblocked_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
        AND is_blocked = TRUE
    `;

    const result = await db.result(query, [adminId, slotId]);

    if (result.rowCount === 0) {
      throw new Error("SLOT_NOT_BLOCKED");
    }
  }

  /**
   * Find blocked slots with filters
   */
  async findBlockedSlots(filters: BlockedSlotFilters): Promise<
    Array<
      BlockedSlot & {
        clinician_name: string;
        centre_name: string;
        blocked_by_admin_name: string;
      }
    >
  > {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.clinician_id !== undefined) {
      conditions.push(`bs.clinician_id = $${paramIndex}`);
      params.push(filters.clinician_id);
      paramIndex++;
    }

    if (filters.centre_id !== undefined) {
      conditions.push(`bs.centre_id = $${paramIndex}`);
      params.push(filters.centre_id);
      paramIndex++;
    }

    if (filters.date_from !== undefined) {
      conditions.push(`bs.blocked_date >= $${paramIndex}`);
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters.date_to !== undefined) {
      conditions.push(`bs.blocked_date <= $${paramIndex}`);
      params.push(filters.date_to);
      paramIndex++;
    }

    if (filters.is_blocked !== undefined) {
      conditions.push(`bs.is_blocked = $${paramIndex}`);
      params.push(filters.is_blocked);
      paramIndex++;
    }

    if (filters.blocked_by_admin_id !== undefined) {
      conditions.push(`bs.blocked_by_admin_id = $${paramIndex}`);
      params.push(filters.blocked_by_admin_id);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        bs.*,
        u_clinician.full_name as clinician_name,
        c.name as centre_name,
        u_admin.full_name as blocked_by_admin_name
      FROM blocked_slots bs
      JOIN clinician_profiles cp ON bs.clinician_id = cp.id
      JOIN users u_clinician ON cp.user_id = u_clinician.id
      JOIN centres c ON bs.centre_id = c.id
      JOIN users u_admin ON bs.blocked_by_admin_id = u_admin.id
      ${whereClause}
      ORDER BY bs.blocked_date DESC, bs.start_time DESC
    `;

    return db.any(query, params);
  }

  /**
   * Lock a slot for update to prevent concurrent modifications
   * Used in concurrent access control scenarios
   */
  async lockSlotForUpdate(slotId: number): Promise<BlockedSlot> {
    const query = `
      SELECT *
      FROM blocked_slots
      WHERE id = $1
      FOR UPDATE
    `;
    return db.one<BlockedSlot>(query, [slotId]);
  }

  /**
   * Check if a slot is blocked for booking validation
   */
  async isSlotBlocked(
    clinicianId: number,
    centreId: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM blocked_slots
      WHERE clinician_id = $1
        AND centre_id = $2
        AND blocked_date = $3
        AND start_time = $4
        AND end_time = $5
        AND is_blocked = TRUE
    `;

    const result = await db.one<{ count: string }>(query, [
      clinicianId,
      centreId,
      date,
      startTime,
      endTime,
    ]);

    return parseInt(result.count) > 0;
  }

  /**
   * Find blocked slots that overlap with a given time range
   * Used for checking conflicts when booking
   */
  async findBlockedSlotsInRange(
    clinicianId: number,
    centreId: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<BlockedSlot[]> {
    const query = `
      SELECT *
      FROM blocked_slots
      WHERE clinician_id = $1
        AND centre_id = $2
        AND blocked_date = $3
        AND is_blocked = TRUE
        AND (
          (start_time < $5 AND end_time > $4)
          OR (start_time >= $4 AND start_time < $5)
        )
    `;

    return db.any<BlockedSlot>(query, [
      clinicianId,
      centreId,
      date,
      startTime,
      endTime,
    ]);
  }
}

export const slotRepository = new SlotRepository();
