// src/repositories/payment.repository.ts
import { db } from "../config/db";

interface CreatePaymentData {
  patient_id: number;
  appointment_id: number;
  amount: number;
  currency: string;
  razorpay_order_id: string;
  status: PaymentStatus;
  payment_method?: string;
  notes?: string;
}

interface UpdatePaymentStatusData {
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status: PaymentStatus;
  paid_at?: Date;
  failure_reason?: string;
}

type PaymentStatus = "CREATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export class PaymentRepository {
  /**
   * Create payment record with status CREATED
   */
  async createPayment(data: CreatePaymentData) {
    const query = `
      INSERT INTO payments (
        patient_id,
        appointment_id,
        amount,
        currency,
        razorpay_order_id,
        status,
        payment_method,
        notes,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;

    return db.one(query, [
      data.patient_id,
      data.appointment_id,
      data.amount,
      data.currency,
      data.razorpay_order_id,
      data.status,
      data.payment_method || null,
      data.notes || null,
    ]);
  }

  /**
   * Update payment status and payment_id
   */
  async updatePaymentStatus(paymentId: number, data: UpdatePaymentStatusData) {
    const fields: string[] = ["status = $1", "updated_at = NOW()"];
    const values: any[] = [data.status];
    let paramIndex = 2;

    if (data.razorpay_payment_id !== undefined) {
      fields.push(`razorpay_payment_id = $${paramIndex}`);
      values.push(data.razorpay_payment_id);
      paramIndex++;
    }

    if (data.razorpay_signature !== undefined) {
      fields.push(`razorpay_signature = $${paramIndex}`);
      values.push(data.razorpay_signature);
      paramIndex++;
    }

    if (data.paid_at !== undefined) {
      fields.push(`paid_at = $${paramIndex}`);
      values.push(data.paid_at);
      paramIndex++;
    }

    if (data.failure_reason !== undefined) {
      fields.push(`failure_reason = $${paramIndex}`);
      values.push(data.failure_reason);
      paramIndex++;
    }

    const query = `
      UPDATE payments
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    values.push(paymentId);

    return db.one(query, values);
  }

  /**
   * Find payment by order ID
   */
  async findPaymentByOrderId(orderId: string) {
    const query = `
      SELECT *
      FROM payments
      WHERE razorpay_order_id = $1
    `;

    return db.oneOrNone(query, [orderId]);
  }

  /**
   * Find payment by ID
   */
  async findPaymentById(paymentId: number) {
    const query = `
      SELECT
        p.*,
        u.full_name as patient_name,
        u.phone as patient_phone,
        a.scheduled_start_at as appointment_date,
        a.appointment_type
      FROM payments p
      JOIN users u ON p.patient_id = u.id
      JOIN appointments a ON p.appointment_id = a.id
      WHERE p.id = $1
    `;

    return db.oneOrNone(query, [paymentId]);
  }

  /**
   * Find payments by patient
   */
  async findPaymentsByPatient(patientId: number) {
    const query = `
      SELECT
        p.*,
        a.scheduled_start_at as appointment_date,
        a.appointment_type,
        u_clinician.full_name as clinician_name
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u_clinician ON cp.user_id = u_clinician.id
      WHERE p.patient_id = $1
      ORDER BY p.created_at DESC
    `;

    return db.any(query, [patientId]);
  }

  /**
   * Find payment by appointment
   */
  async findPaymentByAppointment(appointmentId: number) {
    const query = `
      SELECT *
      FROM payments
      WHERE appointment_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return db.oneOrNone(query, [appointmentId]);
  }

  /**
   * Find all payments with filters
   */
  async findPayments(filters?: {
    status?: PaymentStatus;
    patientId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const conditions: string[] = ["1=1"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      conditions.push(`p.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.patientId) {
      conditions.push(`p.patient_id = $${paramIndex}`);
      params.push(filters.patientId);
      paramIndex++;
    }

    if (filters?.startDate) {
      conditions.push(`p.created_at >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      conditions.push(`p.created_at <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    const query = `
      SELECT
        p.*,
        u.full_name as patient_name,
        u.phone as patient_phone,
        a.scheduled_start_at as appointment_date,
        a.appointment_type
      FROM payments p
      JOIN users u ON p.patient_id = u.id
      JOIN appointments a ON p.appointment_id = a.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY p.created_at DESC
    `;

    return db.any(query, params);
  }

  /**
   * Create refund record
   */
  async createRefund(paymentId: number, amount: number, reason: string) {
    const query = `
      INSERT INTO payment_refunds (
        payment_id,
        amount,
        reason,
        status,
        created_at
      )
      VALUES ($1, $2, $3, 'PENDING', NOW())
      RETURNING *;
    `;

    return db.one(query, [paymentId, amount, reason]);
  }

  /**
   * Update refund status
   */
  async updateRefundStatus(
    refundId: number,
    status: string,
    razorpayRefundId?: string
  ) {
    const query = `
      UPDATE payment_refunds
      SET status = $1,
          razorpay_refund_id = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    return db.one(query, [status, razorpayRefundId || null, refundId]);
  }
}

export const paymentRepository = new PaymentRepository();
