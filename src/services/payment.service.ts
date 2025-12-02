// src/services/payment.service.ts
import {
  validateCreatePayment,
  validateVerifyPayment,
} from "../validations/payment.validation";
import { paymentRepository } from "../repositories/payment.repository";
import { appointmentRepository } from "../repositories/appointment.repository";
import { patientRepository } from "../repositories/patient.repository";
import { ApiError } from "../utils/apiError";
import { createOrder, verifyPaymentSignature } from "../utils/razorpay";
import { JwtPayload } from "../utils/jwt";

export class PaymentService {
  /*
   Creates a Razorpay order and a payments record.
   The appointment must exist and belong to the current patient or be valid for staff.
  */
  async createPaymentIntent(body: any, authUser: JwtPayload) {
    const dto = validateCreatePayment(body);

    const appointment = await appointmentRepository.getAppointmentById(
      dto.appointment_id
    );
    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    let patientProfileId: number;

    if (authUser.userType === "PATIENT") {
      const patient = await patientRepository.findByUserId(authUser.userId);
      if (!patient || patient.profile.id !== appointment.patient_id) {
        throw ApiError.forbidden(
          "You do not have access to pay for this appointment"
        );
      }
      patientProfileId = patient.profile.id;
    } else {
      const patient = await patientRepository.findById(appointment.patient_id);
      if (!patient) {
        throw ApiError.badRequest("Patient not found for this appointment");
      }
      patientProfileId = patient.profile.id;
    }

    const amountInPaise = Math.round(dto.amount * 100);

    const order = await createOrder({
      amountInPaise,
      currency: dto.currency,
      receipt: `appt_${appointment.id}`,
      notes: {
        appointment_id: String(appointment.id),
        patient_id: String(patientProfileId),
      },
    });

    const paymentRecord = await paymentRepository.createPaymentRecord({
      patient_id: patientProfileId,
      appointment_id: appointment.id,
      amount: dto.amount,
      currency: dto.currency,
      provider: "RAZORPAY",
      order_id: order.id,
    });

    return {
      order,
      payment: paymentRecord,
      publicKey: process.env.RAZORPAY_KEY_ID,
    };
  }

  /*
   Called from frontend after Razorpay checkout success, to verify signature.
  */
  async verifyAndCapture(body: any, authUser: JwtPayload) {
    const dto = validateVerifyPayment(body);

    const isValid = verifyPaymentSignature(dto);
    if (!isValid) {
      throw ApiError.badRequest("Invalid payment signature");
    }

    const paymentRecord = await paymentRepository.findByOrderId(
      dto.razorpay_order_id
    );
    if (!paymentRecord) {
      throw ApiError.notFound("Payment record not found for this order");
    }

    if (authUser.userType === "PATIENT") {
      const patient = await patientRepository.findByUserId(authUser.userId);
      if (!patient || patient.profile.id !== paymentRecord.patient_id) {
        throw ApiError.forbidden("You do not have access to this payment");
      }
    }

    const updatedPayment = await paymentRepository.updateStatusByOrderId(
      dto.razorpay_order_id,
      {
        status: "SUCCESS",
        payment_id: dto.razorpay_payment_id,
        payment_method_details: null,
      }
    );

    try {
      await appointmentRepository.updateStatus(
        paymentRecord.appointment_id,
        "CONFIRMED",
        authUser.userId,
        "Payment successful, appointment confirmed"
      );
    } catch (err) {
      console.error("Failed to update appointment status after payment:", err);
    }

    return updatedPayment;
  }

  /*
   Webhook handler for Razorpay events.
  */
  async handleWebhook(payload: any) {
    const record = await paymentRepository.createWebhookEvent({
      provider_event_id: payload?.payload?.payment?.entity?.id || null,
      event_type: payload?.event || null,
      raw_payload: payload,
    });

    await paymentRepository.markWebhookProcessed(record.id);

    return { processed: true };
  }
}

export const paymentService = new PaymentService();
