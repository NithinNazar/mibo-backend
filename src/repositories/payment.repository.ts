// src/repositories/payment.repository.ts
import { db } from "../config/db";

export interface Payment {
  id: number;
  patient_id: number;
  appointment_id: number;
  provider: string;
  order_id: string;
  payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method_details: any;
  error_code: string | null;
  error_description: string | null;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

class PaymentRepository {
  /**
   * Create payment record
   */
  async createPayment(data: {
    patientId: number;
    appointmentId: number;
    orderId: string;
    amount: number;
    currency?: string;
    paymentLinkId?: string;
    paymentLinkUrl?: string;
  }): Promise<Payment> {
    return await db.one(
      `INSERT INTO payments (
        patient_id, appointment_id, provider, order_id,
        amount, currency, status, payment_link_id, payment_link_url
      ) VALUES ($1, $2, 'RAZORPAY', $3, $4, $5, 'CREATED', $6, $7)
      RETURNING *`,
      [
        data.patientId,
        data.appointmentId,
        data.orderId,
        data.amount,
        data.currency || "INR",
        data.paymentLinkId || null,
        data.paymentLinkUrl || null,
      ]
    );
  }

  /**
   * Find payment by order ID
   */
  async findPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return await db.oneOrNone("SELECT * FROM payments WHERE order_id = $1", [
      orderId,
    ]);
  }

  /**
   * Find payment by appointment ID
   */
  async findPaymentByAppointmentId(
    appointmentId: number
  ): Promise<Payment | null> {
    return await db.oneOrNone(
      "SELECT * FROM payments WHERE appointment_id = $1 ORDER BY created_at DESC LIMIT 1",
      [appointmentId]
    );
  }

  /**
   * Update payment status to success
   */
  async updatePaymentSuccess(
    orderId: string,
    paymentId: string,
    paymentMethodDetails?: any
  ): Promise<Payment> {
    return await db.one(
      `UPDATE payments 
       SET payment_id = $1,
           status = 'SUCCESS',
           paid_at = NOW(),
           payment_method_details = $2,
           updated_at = NOW()
       WHERE order_id = $3
       RETURNING *`,
      [paymentId, paymentMethodDetails || null, orderId]
    );
  }

  /**
   * Update payment status to failed
   */
  async updatePaymentFailed(
    orderId: string,
    errorCode?: string,
    errorDescription?: string
  ): Promise<Payment> {
    return await db.one(
      `UPDATE payments 
       SET status = 'FAILED',
           error_code = $1,
           error_description = $2,
           updated_at = NOW()
       WHERE order_id = $3
       RETURNING *`,
      [errorCode || null, errorDescription || null, orderId]
    );
  }

  /**
   * Get payment details with appointment info
   */
  async getPaymentDetails(paymentId: number): Promise<any | null> {
    return await db.oneOrNone(
      `SELECT 
        p.*,
        a.scheduled_start_at,
        a.scheduled_end_at,
        a.appointment_type,
        a.status as appointment_status,
        u.full_name as clinician_name,
        cp.specialization,
        c.name as centre_name,
        pu.full_name as patient_name,
        pu.phone as patient_phone,
        pu.email as patient_email
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON a.centre_id = c.id
      JOIN patient_profiles pp ON a.patient_id = pp.id
      JOIN users pu ON pp.user_id = pu.id
      WHERE p.id = $1`,
      [paymentId]
    );
  }

  /**
   * Get patient payments
   */
  async getPatientPayments(
    patientId: number,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Payment[]> {
    let query = `
      SELECT p.*, a.scheduled_start_at, a.appointment_type
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      WHERE p.patient_id = $1
    `;

    const params: any[] = [patientId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    return await db.any(query, params);
  }

  /**
   * Store payment webhook event
   */
  async storeWebhookEvent(data: {
    provider: string;
    providerEventId?: string;
    eventType?: string;
    rawPayload: any;
  }): Promise<any> {
    return await db.one(
      `INSERT INTO payment_webhook_events (
        provider, provider_event_id, event_type, raw_payload, processed
      ) VALUES ($1, $2, $3, $4, false)
      RETURNING *`,
      [
        data.provider,
        data.providerEventId || null,
        data.eventType || null,
        data.rawPayload,
      ]
    );
  }

  /**
   * Mark webhook event as processed
   */
  async markWebhookProcessed(eventId: number): Promise<void> {
    await db.none(
      `UPDATE payment_webhook_events 
       SET processed = true, processed_at = NOW()
       WHERE id = $1`,
      [eventId]
    );
  }

  /**
   * Get payment statistics for patient
   */
  async getPatientPaymentStats(patientId: number): Promise<{
    totalPaid: number;
    totalPending: number;
    successfulPayments: number;
    failedPayments: number;
  }> {
    const stats = await db.one(
      `SELECT 
        COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status IN ('CREATED', 'PENDING') THEN amount ELSE 0 END), 0) as total_pending,
        COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_payments
      FROM payments
      WHERE patient_id = $1`,
      [patientId]
    );

    return {
      totalPaid: parseFloat(stats.total_paid),
      totalPending: parseFloat(stats.total_pending),
      successfulPayments: parseInt(stats.successful_payments),
      failedPayments: parseInt(stats.failed_payments),
    };
  }

  /**
   * Update payment with payment link details
   */
  async updatePaymentLink(
    paymentId: number,
    paymentLinkId: string,
    paymentLinkUrl: string
  ): Promise<Payment> {
    return await db.one(
      `UPDATE payments 
       SET payment_link_id = $1,
           payment_link_url = $2,
           payment_link_sent_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [paymentLinkId, paymentLinkUrl, paymentId]
    );
  }
}

export const paymentRepository = new PaymentRepository();
