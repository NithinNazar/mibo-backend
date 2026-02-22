// src/repositories/notification.repository.ts
import { db } from "../config/db";

interface CreateNotificationData {
  user_id: number;
  phone: string;
  channel: string;
  template_id?: number;
  payload_data?: any;
  status: string;
  error_message?: string;
}

interface UpdateNotificationStatusData {
  status: string;
  sent_at?: Date;
  error_message?: string;
}

export class NotificationRepository {
  /**
   * Create notification log to store notification attempts
   */
  async createNotificationLog(data: CreateNotificationData) {
    const query = `
      INSERT INTO notifications (
        user_id,
        phone,
        channel,
        template_id,
        payload_data,
        status,
        error_message,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;
    `;

    return db.one(query, [
      data.user_id,
      data.phone,
      data.channel,
      data.template_id || null,
      data.payload_data ? JSON.stringify(data.payload_data) : null,
      data.status,
      data.error_message || null,
    ]);
  }

  /**
   * Update notification status to track delivery status
   */
  async updateNotificationStatus(
    notificationId: number,
    data: UpdateNotificationStatusData,
  ) {
    const fields: string[] = ["status = $1", "updated_at = NOW()"];
    const values: any[] = [data.status];
    let paramIndex = 2;

    if (data.sent_at !== undefined) {
      fields.push(`sent_at = $${paramIndex}`);
      values.push(data.sent_at);
      paramIndex++;
    }

    if (data.error_message !== undefined) {
      fields.push(`error_message = $${paramIndex}`);
      values.push(data.error_message);
      paramIndex++;
    }

    const query = `
      UPDATE notifications
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
    userId?: number;
    channel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const conditions: string[] = ["1=1"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.userId) {
      conditions.push(`n.user_id = $${paramIndex}`);
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters?.channel) {
      conditions.push(`n.channel = $${paramIndex}`);
      params.push(filters.channel);
      paramIndex++;
    }

    if (filters?.status) {
      conditions.push(`n.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.startDate) {
      conditions.push(`n.created_at >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      conditions.push(`n.created_at <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    const limit = filters?.limit || 100;

    const query = `
      SELECT
        n.*,
        u.full_name as user_name,
        u.phone as user_phone
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY n.created_at DESC
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
        n.*,
        u.full_name as user_name,
        u.phone as user_phone
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.id = $1
    `;

    return db.oneOrNone(query, [notificationId]);
  }

  /**
   * Get notifications by user
   */
  async getNotificationsByUser(userId: number, limit: number = 50) {
    const query = `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    return db.any(query, [userId, limit]);
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
        channel,
        status,
        COUNT(*) as count
      FROM notifications
      WHERE ${conditions.join(" AND ")}
      GROUP BY channel, status
      ORDER BY channel, status
    `;

    return db.any(query, params);
  }

  /**
   * Get notifications by phone number
   */
  async getNotificationsByPhone(phone: string, limit: number = 50) {
    const query = `
      SELECT *
      FROM notifications
      WHERE phone = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    return db.any(query, [phone, limit]);
  }

  /**
   * Get notifications by template
   */
  async getNotificationsByTemplate(templateId: number, limit: number = 100) {
    const query = `
      SELECT
        n.*,
        u.full_name as user_name,
        u.phone as user_phone
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.template_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2
    `;

    return db.any(query, [templateId, limit]);
  }
}

export const notificationRepository = new NotificationRepository();
