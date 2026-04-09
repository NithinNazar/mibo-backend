// src/repositories/audit.repository.ts
import { db } from "../config/db";
import { SlotAuditData, AuditFilters } from "../types/slot-blocking.types";

interface AuditEntry {
  id: number;
  blocked_slot_id: number;
  action_type: "BLOCK" | "UNBLOCK";
  admin_id: number;
  admin_name?: string;
  reason: string | null;
  affected_appointment_ids: number[];
  affected_patient_count: number;
  metadata: Record<string, any> | null;
  created_at: Date;
}

export class AuditRepository {
  /**
   * Log a slot blocking or unblocking action
   */
  async logSlotAction(data: SlotAuditData): Promise<void> {
    const query = `
      INSERT INTO slot_blocking_audit (
        blocked_slot_id,
        action_type,
        admin_id,
        reason,
        affected_appointment_ids,
        affected_patient_count,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await db.none(query, [
      data.blocked_slot_id,
      data.action_type,
      data.admin_id,
      data.reason || null,
      data.affected_appointment_ids,
      data.affected_patient_count,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]);
  }

  /**
   * Get audit history for a specific slot
   */
  async getSlotHistory(slotId: number): Promise<AuditEntry[]> {
    const query = `
      SELECT
        sa.*,
        u.full_name as admin_name
      FROM slot_blocking_audit sa
      JOIN users u ON sa.admin_id = u.id
      WHERE sa.blocked_slot_id = $1
      ORDER BY sa.created_at ASC
    `;

    return db.any<AuditEntry>(query, [slotId]);
  }

  /**
   * Get all actions performed by a specific admin
   */
  async getAdminActions(
    adminId: number,
    filters?: AuditFilters,
  ): Promise<AuditEntry[]> {
    const conditions: string[] = ["sa.admin_id = $1"];
    const params: any[] = [adminId];
    let paramIndex = 2;

    if (filters?.action_type) {
      conditions.push(`sa.action_type = $${paramIndex}`);
      params.push(filters.action_type);
      paramIndex++;
    }

    if (filters?.date_from) {
      conditions.push(`sa.created_at >= $${paramIndex}`);
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters?.date_to) {
      conditions.push(`sa.created_at <= $${paramIndex}`);
      params.push(filters.date_to);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const query = `
      SELECT
        sa.*,
        u.full_name as admin_name
      FROM slot_blocking_audit sa
      JOIN users u ON sa.admin_id = u.id
      WHERE ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    return db.any<AuditEntry>(query, params);
  }

  /**
   * Get all audit entries with optional filters
   */
  async getAllAuditEntries(filters?: AuditFilters): Promise<AuditEntry[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.action_type) {
      conditions.push(`sa.action_type = $${paramIndex}`);
      params.push(filters.action_type);
      paramIndex++;
    }

    if (filters?.date_from) {
      conditions.push(`sa.created_at >= $${paramIndex}`);
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters?.date_to) {
      conditions.push(`sa.created_at <= $${paramIndex}`);
      params.push(filters.date_to);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const query = `
      SELECT
        sa.*,
        u.full_name as admin_name
      FROM slot_blocking_audit sa
      JOIN users u ON sa.admin_id = u.id
      ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    return db.any<AuditEntry>(query, params);
  }

  /**
   * Get count of audit entries for a specific admin
   */
  async getAdminActionCount(
    adminId: number,
    filters?: AuditFilters,
  ): Promise<number> {
    const conditions: string[] = ["admin_id = $1"];
    const params: any[] = [adminId];
    let paramIndex = 2;

    if (filters?.action_type) {
      conditions.push(`action_type = $${paramIndex}`);
      params.push(filters.action_type);
      paramIndex++;
    }

    if (filters?.date_from) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters?.date_to) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(filters.date_to);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    const query = `
      SELECT COUNT(*) as count
      FROM slot_blocking_audit
      WHERE ${whereClause}
    `;

    const result = await db.one<{ count: string }>(query, params);
    return parseInt(result.count);
  }

  /**
   * Get audit entry by ID
   */
  async getAuditEntryById(id: number): Promise<AuditEntry | null> {
    const query = `
      SELECT
        sa.*,
        u.full_name as admin_name
      FROM slot_blocking_audit sa
      JOIN users u ON sa.admin_id = u.id
      WHERE sa.id = $1
    `;

    return db.oneOrNone<AuditEntry>(query, [id]);
  }
}

export const auditRepository = new AuditRepository();
