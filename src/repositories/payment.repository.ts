// src/repositories/payment.repository.ts
import { db } from "../config/db";

export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED";

export class PaymentRepository {
  async createPaymentRecord(params: {
    patient_id: number;
    appointment_id: number;
    amount: number;
    currency: string;
    provider: string;
    order_id: string;
  }) {
    const query = `
      INSERT INTO payments (
        patient_id,
        appointment_id,
        provider,
        order_id,
        amount,
        currency,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'CREATED', NOW(), NOW())
      RETURNING *;
    `;
    const payment = await db.one(query, [
      params.patient_id,
      params.appointment_id,
      params.provider,
      params.order_id,
      params.amount,
      params.currency,
    ]);
    return payment;
  }

  async findByOrderId(orderId: string) {
    const query = `
      SELECT * FROM payments
      WHERE order_id = $1
      LIMIT 1;
    `;
    return db.oneOrNone(query, [orderId]);
  }

  async updateStatusByOrderId(
    orderId: string,
    params: {
      status: PaymentStatus;
      payment_id?: string | null;
      payment_method_details?: any;
      error_code?: string | null;
      error_description?: string | null;
    }
  ) {
    const query = `
      UPDATE payments
      SET 
        status = $1,
        payment_id = COALESCE($2, payment_id),
        payment_method_details = COALESCE($3::jsonb, payment_method_details),
        error_code = COALESCE($4, error_code),
        error_description = COALESCE($5, error_description),
        paid_at = CASE WHEN $1 = 'SUCCESS' THEN NOW() ELSE paid_at END,
        updated_at = NOW()
      WHERE order_id = $6
      RETURNING *;
    `;
    const updated = await db.one(query, [
      params.status,
      params.payment_id || null,
      params.payment_method_details
        ? JSON.stringify(params.payment_method_details)
        : null,
      params.error_code || null,
      params.error_description || null,
      orderId,
    ]);
    return updated;
  }

  async createWebhookEvent(params: {
    provider_event_id?: string | null;
    event_type?: string | null;
    raw_payload: any;
  }) {
    const query = `
      INSERT INTO payment_webhook_events (
        provider,
        provider_event_id,
        event_type,
        raw_payload,
        processed,
        created_at
      )
      VALUES ('RAZORPAY', $1, $2, $3::jsonb, FALSE, NOW())
      RETURNING *;
    `;
    const record = await db.one(query, [
      params.provider_event_id || null,
      params.event_type || null,
      JSON.stringify(params.raw_payload),
    ]);
    return record;
  }

  async markWebhookProcessed(id: number) {
    const query = `
      UPDATE payment_webhook_events
      SET processed = TRUE, processed_at = NOW()
      WHERE id = $1;
    `;
    await db.none(query, [id]);
  }
}

export const paymentRepository = new PaymentRepository();
