// src/services/payment.service.ts
import { paymentRepository } from "../repositories/payment.repository";
import { appointmentRepository } from "../repositories/appointment.repository";
import { patientRepository } from "../repositories/patient.repository";
import { razorpayUtil } from "../utils/razorpay";
import { ApiError } from "../utils/apiError";
import { db } from "../config/db";
import logger from "../config/logger";

export class PaymentService {
  /**
   * Create Razorpay order with appointment amount lookup
   */
  async createRazorpayOrder(appointmentId: number, patientId: number) {
    // Check if Razorpay is configured
    if (!razorpayUtil.isConfigured()) {
      throw ApiError.serviceUnavailable(
        "Payment service is not configured. Please contact support."
      );
    }

    // Get appointment details
    const appointment = await appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    // Verify patient owns the appointment
    if (appointment.patient_id !== patientId) {
      throw ApiError.forbidden("You do not have access to this appointment");
    }

    // Check if payment already exists
    const existingPayment = await paymentRepository.findPaymentByAppointment(
      appointmentId
    );
    if (existingPayment && existingPayment.status === "SUCCESS") {
      throw ApiError.conflict("Payment already completed for this appointment");
    }

    // Get consultation fee from clinician profile
    const amount = await this.getConsultationFee(appointment.clinician_id);
    const currency = "INR";

    try {
      // Create Razorpay order
      const order = await razorpayUtil.createOrder(
        amount,
        currency,
        `appointment_${appointmentId}`,
        {
          appointment_id: appointmentId.toString(),
          patient_id: patientId.toString(),
        }
      );

      // Create payment record in database
      const payment = await paymentRepository.createPayment({
        patient_id: patientId,
        appointment_id: appointmentId,
        amount: amount / 100, // Store in rupees
        currency,
        razorpay_order_id: order.id,
        status: "CREATED",
        notes: `Payment for appointment #${appointmentId}`,
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        paymentId: payment.id,
      };
    } catch (error: any) {
      logger.error("Failed to create Razorpay order:", error);
      throw ApiError.internal("Failed to create payment order");
    }
  }

  /**
   * Verify payment with signature verification
   */
  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    // Verify signature
    const isValid = razorpayUtil.verifyPaymentSignature(
      orderId,
      paymentId,
      signature
    );

    if (!isValid) {
      throw ApiError.badRequest("Invalid payment signature");
    }

    // Find payment record
    const payment = await paymentRepository.findPaymentByOrderId(orderId);
    if (!payment) {
      throw ApiError.notFound("Payment record not found");
    }

    // Update payment status
    const updatedPayment = await paymentRepository.updatePaymentStatus(
      payment.id,
      {
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        status: "SUCCESS",
        paid_at: new Date(),
      }
    );

    // Handle payment success
    await this.handlePaymentSuccess(payment.appointment_id);

    return updatedPayment;
  }

  /**
   * Handle payment success - update appointment status
   */
  async handlePaymentSuccess(appointmentId: number) {
    try {
      // Update appointment status to CONFIRMED
      await appointmentRepository.updateStatus(
        appointmentId,
        "CONFIRMED",
        1, // System user ID
        "Payment completed successfully"
      );

      logger.info(
        `Appointment ${appointmentId} confirmed after successful payment`
      );

      // TODO: Trigger appointment confirmation notification
      // await notificationService.sendAppointmentConfirmation(appointmentId);
    } catch (error) {
      logger.error(`Failed to update appointment status after payment:`, error);
      // Don't throw error - payment is already successful
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(orderId: string, reason: string) {
    const payment = await paymentRepository.findPaymentByOrderId(orderId);
    if (!payment) {
      throw ApiError.notFound("Payment record not found");
    }

    await paymentRepository.updatePaymentStatus(payment.id, {
      status: "FAILED",
      failure_reason: reason,
    });

    logger.warn(`Payment failed for order ${orderId}: ${reason}`);
  }

  /**
   * Get payments by patient
   */
  async getPaymentsByPatient(patientId: number) {
    return await paymentRepository.findPaymentsByPatient(patientId);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: number) {
    const payment = await paymentRepository.findPaymentById(paymentId);
    if (!payment) {
      throw ApiError.notFound("Payment not found");
    }
    return payment;
  }

  /**
   * Get all payments with filters
   */
  async getPayments(filters?: {
    status?: string;
    patientId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    return await paymentRepository.findPayments(filters as any);
  }

  /**
   * Handle Razorpay webhook
   */
  async handleWebhook(body: any, signature: string) {
    // Verify webhook signature
    const isValid = razorpayUtil.verifyWebhookSignature(
      JSON.stringify(body),
      signature
    );

    if (!isValid) {
      throw ApiError.badRequest("Invalid webhook signature");
    }

    const event = body.event;
    const payload = body.payload.payment.entity;

    logger.info(`Received Razorpay webhook: ${event}`);

    switch (event) {
      case "payment.captured":
        await this.handlePaymentCaptured(payload);
        break;

      case "payment.failed":
        await this.handlePaymentFailure(
          payload.order_id,
          payload.error_description || "Payment failed"
        );
        break;

      case "refund.created":
        // Handle refund
        logger.info(`Refund created: ${payload.id}`);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event}`);
    }

    return { received: true };
  }

  /**
   * Handle payment captured event
   */
  private async handlePaymentCaptured(payload: any) {
    const payment = await paymentRepository.findPaymentByOrderId(
      payload.order_id
    );

    if (payment) {
      await paymentRepository.updatePaymentStatus(payment.id, {
        razorpay_payment_id: payload.id,
        status: "SUCCESS",
        paid_at: new Date(payload.created_at * 1000),
      });

      await this.handlePaymentSuccess(payment.appointment_id);
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentId: number, amount?: number, reason?: string) {
    const payment = await paymentRepository.findPaymentById(paymentId);
    if (!payment) {
      throw ApiError.notFound("Payment not found");
    }

    if (payment.status !== "SUCCESS") {
      throw ApiError.badRequest("Can only refund successful payments");
    }

    if (!payment.razorpay_payment_id) {
      throw ApiError.badRequest("Payment ID not found");
    }

    try {
      // Create refund in Razorpay
      const refund = await razorpayUtil.createRefund(
        payment.razorpay_payment_id,
        amount ? amount * 100 : undefined // Convert to paise
      );

      // Create refund record
      const refundRecord = await paymentRepository.createRefund(
        paymentId,
        amount || payment.amount,
        reason || "Refund requested"
      );

      // Update refund with Razorpay ID
      await paymentRepository.updateRefundStatus(
        refundRecord.id,
        "SUCCESS",
        refund.id
      );

      // Update payment status
      await paymentRepository.updatePaymentStatus(paymentId, {
        status: "REFUNDED",
      });

      logger.info(`Refund created for payment ${paymentId}`);

      return refundRecord;
    } catch (error: any) {
      logger.error("Failed to create refund:", error);
      throw ApiError.internal("Failed to process refund");
    }
  }

  /**
   * Get consultation fee from clinician profile
   */
  private async getConsultationFee(clinicianId: number): Promise<number> {
    try {
      const { staffRepository } = await import(
        "../repositories/staff.repository"
      );
      const clinician = await staffRepository.findClinicianById(clinicianId);

      if (!clinician || !clinician.consultation_fee) {
        // Default fee if not set
        logger.warn(
          `Consultation fee not found for clinician ${clinicianId}, using default`
        );
        return 100000; // ₹1000 in paise
      }

      return clinician.consultation_fee * 100; // Convert to paise
    } catch (error) {
      logger.error("Failed to fetch consultation fee:", error);
      return 100000; // Default ₹1000 in paise
    }
  }

  /**
   * Get clinician details
   */
  private async getClinicianDetails(clinicianId: number) {
    const clinician = await db.oneOrNone(
      `
      SELECT cp.id, u.full_name, cp.specialization, cp.consultation_fee
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = $1
      `,
      [clinicianId]
    );

    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }

    return clinician;
  }

  /**
   * Create payment link and send to patient via WhatsApp
   */
  async createAndSendPaymentLink(appointmentId: number) {
    // Check if Razorpay is configured
    if (!razorpayUtil.isConfigured()) {
      throw ApiError.serviceUnavailable(
        "Payment service is not configured. Please contact support."
      );
    }

    // Get appointment details
    const appointment = await appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    // Get patient details
    const patient = await patientRepository.findById(appointment.patient_id);
    if (!patient) {
      throw ApiError.notFound("Patient not found");
    }

    // Check if payment already exists
    const existingPayment = await paymentRepository.findPaymentByAppointment(
      appointmentId
    );
    if (existingPayment && existingPayment.status === "SUCCESS") {
      throw ApiError.conflict("Payment already completed for this appointment");
    }

    // Get consultation fee
    const amount = await this.getConsultationFee(appointment.clinician_id);

    // Get clinician name
    const clinician = await this.getClinicianDetails(appointment.clinician_id);

    try {
      // Create Razorpay payment link
      const paymentLink = await razorpayUtil.createPaymentLink(
        amount,
        patient.user.full_name,
        patient.user.phone,
        `Consultation with ${clinician.full_name}`,
        `appointment_${appointmentId}`
      );

      // Create payment record in database
      const payment = await paymentRepository.createPayment({
        patient_id: appointment.patient_id,
        appointment_id: appointmentId,
        amount: amount / 100, // Store in rupees
        currency: "INR",
        razorpay_order_id: paymentLink.id,
        status: "CREATED",
        notes: `Payment link for appointment #${appointmentId}`,
      });

      // Format appointment date and time
      const appointmentDate = new Date(
        appointment.scheduled_start_at
      ).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const appointmentTime = new Date(
        appointment.scheduled_start_at
      ).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Send payment link via WhatsApp using Gallabox
      const { gallaboxUtil } = await import("../utils/gallabox");
      const whatsappResult = await gallaboxUtil.sendPaymentLink(
        patient.user.phone,
        patient.user.full_name,
        amount / 100, // Amount in rupees
        paymentLink.short_url,
        clinician.full_name,
        appointmentDate,
        appointmentTime
      );

      logger.info(
        `Payment link sent for appointment ${appointmentId} to ${patient.user.phone}`
      );

      return {
        paymentLinkId: paymentLink.id,
        shortUrl: paymentLink.short_url,
        amount: amount / 100,
        currency: "INR",
        paymentId: payment.id,
        whatsappSent: whatsappResult.success,
        expiresAt: paymentLink.expire_by
          ? new Date(paymentLink.expire_by * 1000)
          : null,
      };
    } catch (error: any) {
      logger.error("Failed to create and send payment link:", error);
      throw ApiError.internal("Failed to create payment link");
    }
  }

  /**
   * Get payment link status
   */
  async getPaymentLinkStatus(paymentLinkId: string) {
    try {
      const paymentLink = await razorpayUtil.fetchPaymentLink(paymentLinkId);

      return {
        paymentLinkId: paymentLink.id,
        status: paymentLink.status, // created, paid, partially_paid, expired, cancelled
        amount: paymentLink.amount / 100,
        amountPaid: paymentLink.amount_paid / 100,
        shortUrl: paymentLink.short_url,
        createdAt: new Date(paymentLink.created_at * 1000),
        expiresAt: paymentLink.expire_by
          ? new Date(paymentLink.expire_by * 1000)
          : null,
      };
    } catch (error: any) {
      logger.error("Failed to fetch payment link status:", error);
      throw ApiError.internal("Failed to fetch payment link status");
    }
  }
}

export const paymentService = new PaymentService();
