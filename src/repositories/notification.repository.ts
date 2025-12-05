// src/repositories/notification.repository.ts
import { db } from "../config/db";

interface CreateNotificationData {
  patient_id: number;
  appointment_id?: number;
  notification_type: string;
  channel: string;
  recipient_phone: string;
  message_content: string;
  status: string;
  external_message_id?: string;
}

interface UpdateNotificationStatusData {
  status: string;
  delivered_at?: Date;
  failure_reason?: string;
}

export class NotificationRepository {
  /**
   * Create notification log to store notification attempts
   */
  async createNotificationLog(data: CreateNotificationData) {
    const query = `
      INSERT INTO notification_logs (
        patient_id,
        appointment_id,
        notification_type,
        channel,
        recipient_phone,
        message_content,
        status,
        external_message_id,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;

    return db.one(query, [
      data.patient_id,
      data.appointment_id || null,
      data.notification_type,
      data.channel,
      data.recipient_phone,
      data.message_content,
      data.status,
      data.external_message_id || null,
    ]);
  }

  /**
   * Update notification status to track delivery status
   */
  async updateNotificationStatus(
    notificationId: number,
    data: UpdateNotificationStatusData
  ) {
    const fields: string[] = ["status = $1", "updated_at = NOW()"];
    const values: any[] = [data.status];
    let paramIndex = 2;

    if (data.delivered_at !== undefined) {
      fields.push(`delivered_at = $${paramIndex}`);
      values.push(data.delivered_at);
      paramIndex++;
    }

    if (data.failure_reason !== undefined) {
      fields.push(`failure_reason = $${paramIndex}`);
      values.push(data.failure_reason);
      paramIndex++;
    }

    const query = `
      UPDATE notification_logs
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    values.push(notificationId);

    return db.one(query, values);
  }

  /**
   * Get notification history with filters
   */
  async getNotificationHistory(filters?: {
    patientId?: number;
    appointmentId?: number;
    notificationType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const conditions: string[] = ["1=1"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.patientId) {
      conditions.push(`nl.patient_id = $${paramIndex}`);
      params.push(filters.patientId);
      paramIndex++;
    }

    if (filters?.appointmentId) {
      conditions.push(`nl.appointment_id = $${paramIndex}`);
      params.push(filters.appointmentId);
      paramIndex++;
    }

    if (filters?.notificationType) {
      conditions.push(`nl.notification_type = $${paramIndex}`);
      params.push(filters.notificationType);
      paramIndex++;
    }

    if (filters?.status) {
      conditions.push(`nl.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.startDate) {
      conditions.push(`nl.created_at >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      conditions.push(`nl.created_at <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    const limit = filters?.limit || 100;

    const query = `
      SELECT
        nl.*,
        u.full_name as patient_name,
        u.phone as patient_phone
      FROM notification_logs nl
      JOIN users u ON nl.patient_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY nl.created_at DESC
      LIMIT ${limit}
    `;

    return db.any(query, params);
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: number) {
    const query = `
      SELECT
        nl.*,
        u.full_name as patient_name,
        u.phone as patient_phone
      FROM notification_logs nl
      JOIN users u ON nl.patient_id = u.id
      WHERE nl.id = $1
    `;

    return db.oneOrNone(query, [notificationId]);
  }

  /**
   * Get notifications by appointment
   */
  async getNotificationsByAppointment(appointmentId: number) {
    const query = `
      SELECT *
      FROM notification_logs
      WHERE appointment_id = $1
      ORDER BY created_at DESC
    `;

    return db.any(query, [appointmentId]);
  }

  /**
   * Get notifications by patient
   */
  async getNotificationsByPatient(patientId: number, limit: number = 50) {
    const query = `
      SELECT *
      FROM notification_logs
      WHERE patient_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    return db.any(query, [patientId, limit]);
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(startDate?: string, endDate?: string) {
    const conditions: string[] = ["1=1"];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const query = `
      SELECT
        notification_type,
        status,
        COUNT(*) as count
      FROM notification_logs
      WHERE ${conditions.join(" AND ")}
      GROUP BY notification_type, status
      ORDER BY notification_type, status
    `;

    return db.any(query, params);
  }
}

export const notificationRepository = new NotificationRepository();
