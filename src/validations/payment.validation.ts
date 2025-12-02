// src/validations/payment.validation.ts
import { ApiError } from "../utils/apiError";

export interface CreatePaymentDto {
  appointment_id: number;
  amount: number;
  currency: string;
}

export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function validateCreatePayment(body: any): CreatePaymentDto {
  if (!body.appointment_id) {
    throw ApiError.badRequest("appointment_id is required");
  }
  if (!body.amount || Number(body.amount) <= 0) {
    throw ApiError.badRequest("Valid amount is required");
  }

  return {
    appointment_id: Number(body.appointment_id),
    amount: Number(body.amount),
    currency: body.currency ? String(body.currency) : "INR",
  };
}

export function validateVerifyPayment(body: any): VerifyPaymentDto {
  const required = [
    "razorpay_order_id",
    "razorpay_payment_id",
    "razorpay_signature",
  ];
  for (const key of required) {
    if (!body[key]) {
      throw ApiError.badRequest(`${key} is required`);
    }
  }

  return {
    razorpay_order_id: String(body.razorpay_order_id),
    razorpay_payment_id: String(body.razorpay_payment_id),
    razorpay_signature: String(body.razorpay_signature),
  };
}
