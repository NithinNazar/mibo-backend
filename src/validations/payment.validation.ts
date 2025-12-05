// src/validations/payment.validation.ts
import { ApiError } from "../utils/apiError";

export interface CreateOrderDto {
  appointment_id: number;
}

export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CreateRefundDto {
  payment_id: number;
  amount?: number;
  reason?: string;
}

export function validateCreateOrder(body: any): CreateOrderDto {
  if (!body.appointment_id) {
    throw ApiError.badRequest("appointment_id is required");
  }

  const appointmentId = Number(body.appointment_id);
  if (isNaN(appointmentId) || appointmentId <= 0) {
    throw ApiError.badRequest("Invalid appointment_id");
  }

  return {
    appointment_id: appointmentId,
  };
}

export function validateVerifyPayment(body: any): VerifyPaymentDto {
  if (!body.razorpay_order_id || typeof body.razorpay_order_id !== "string") {
    throw ApiError.badRequest("razorpay_order_id is required");
  }

  if (
    !body.razorpay_payment_id ||
    typeof body.razorpay_payment_id !== "string"
  ) {
    throw ApiError.badRequest("razorpay_payment_id is required");
  }

  if (!body.razorpay_signature || typeof body.razorpay_signature !== "string") {
    throw ApiError.badRequest("razorpay_signature is required");
  }

  return {
    razorpay_order_id: body.razorpay_order_id.trim(),
    razorpay_payment_id: body.razorpay_payment_id.trim(),
    razorpay_signature: body.razorpay_signature.trim(),
  };
}

export function validateCreateRefund(body: any): CreateRefundDto {
  if (!body.payment_id) {
    throw ApiError.badRequest("payment_id is required");
  }

  const paymentId = Number(body.payment_id);
  if (isNaN(paymentId) || paymentId <= 0) {
    throw ApiError.badRequest("Invalid payment_id");
  }

  const dto: CreateRefundDto = {
    payment_id: paymentId,
  };

  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      throw ApiError.badRequest("Invalid refund amount");
    }
    dto.amount = amount;
  }

  if (body.reason) {
    dto.reason = String(body.reason).trim();
  }

  return dto;
}

export function validateWebhookPayload(body: any): any {
  if (!body.event || typeof body.event !== "string") {
    throw ApiError.badRequest("Invalid webhook payload: missing event");
  }

  if (!body.payload) {
    throw ApiError.badRequest("Invalid webhook payload: missing payload");
  }

  return body;
}
