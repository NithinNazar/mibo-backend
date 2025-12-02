// src/repositories/notification.repository.ts
import { db } from "../config/db";

export class NotificationRepository {
  async logNotification(params: {
    user_id: number | null;
    phone: string;
    notification_type: string;
    message: string;
    provider_message_id?: string | null;
    delivery_status?: string | null;
  }) {
    const query = `
      INSERT INTO notification_logs (
        user_id,
        phone,
        notification_type,
        message,
        provider_message_id,
        delivery_status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const result = await db.one(query, [
      params.user_id,
      params.phone,
      params.notification_type,
      params.message,
      params.provider_message_id || null,
      params.delivery_status || "SENT",
    ]);
    return result;
  }
}

export const notificationRepository = new NotificationRepository();
