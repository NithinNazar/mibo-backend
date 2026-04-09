// src/repositories/patient-notification.repository.ts
import { db } from "../config/db";
import {
  PatientNotification,
  CreateNotificationData,
  NotificationFilters,
} from "../types/slot-blocking.types";

export class PatientNotificationRepository {
  /**
   * Create a new patient notification
   */
  async createNotification(
    data: CreateNotificationData,
  ): Promise<PatientNotification> {
    const query = `
      INSERT INTO patient_notifications (
        patient_id,
        notification_type,
        title,
        message,
        appointment_id,
        blocked_slot_id,
        metadata,
        is_read
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
      RETURNING *
    `;

    return db.one<PatientNotification>(query, [
      data.patient_id,
      data.notification_type,
      data.title,
      data.message,
      data.appointment_id || null,
      data.blocked_slot_id || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]);
  }

  /**
   * Get notifications for a patient with optional filters
   */
  async getNotificationsByPatient(
    patientId: number,
    filters?: NotificationFilters,
  ): Promise<PatientNotification[]> {
    const conditions: string[] = ["patient_id = $1"];
    const params: any[] = [patientId];
    let paramIndex = 2;

    if (filters?.unread_only) {
      conditions.push("is_read = FALSE");
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

    if (filters?.notification_type) {
      conditions.push(`notification_type = $${paramIndex}`);
      params.push(filters.notification_type);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    const query = `
      SELECT *
      FROM patient_notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    return db.any<PatientNotification>(query, params);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number, patientId: number): Promise<void> {
    const query = `
      UPDATE patient_notifications
      SET is_read = TRUE,
          read_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
        AND patient_id = $2
        AND is_read = FALSE
    `;

    const result = await db.result(query, [notificationId, patientId]);

    if (result.rowCount === 0) {
      throw new Error("NOTIFICATION_NOT_FOUND_OR_ALREADY_READ");
    }
  }

  /**
   * Get count of unread notifications for a patient
   */
  async getUnreadCount(patientId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM patient_notifications
      WHERE patient_id = $1
        AND is_read = FALSE
    `;

    const result = await db.one<{ count: string }>(query, [patientId]);
    return parseInt(result.count);
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(
    notificationId: number,
  ): Promise<PatientNotification | null> {
    const query = `
      SELECT *
      FROM patient_notifications
      WHERE id = $1
    `;

    return db.oneOrNone<PatientNotification>(query, [notificationId]);
  }

  /**
   * Get total count of notifications for a patient with filters
   */
  async getNotificationCount(
    patientId: number,
    filters?: NotificationFilters,
  ): Promise<number> {
    const conditions: string[] = ["patient_id = $1"];
    const params: any[] = [patientId];
    let paramIndex = 2;

    if (filters?.unread_only) {
      conditions.push("is_read = FALSE");
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

    if (filters?.notification_type) {
      conditions.push(`notification_type = $${paramIndex}`);
      params.push(filters.notification_type);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    const query = `
      SELECT COUNT(*) as count
      FROM patient_notifications
      WHERE ${whereClause}
    `;

    const result = await db.one<{ count: string }>(query, params);
    return parseInt(result.count);
  }

  /**
   * Delete old notifications (for cleanup/maintenance)
   * Deletes notifications older than specified days
   */
  async deleteOldNotifications(daysOld: number): Promise<number> {
    const query = `
      DELETE FROM patient_notifications
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `;

    const result = await db.result(query);
    return result.rowCount;
  }
}

export const patientNotificationRepository =
  new PatientNotificationRepository();
