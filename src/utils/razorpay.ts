// src/utils/razorpay.ts
import Razorpay from "razorpay";
import crypto from "crypto";
import { ENV } from "../config/env";

if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) {
  console.warn(
    "Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
  );
}

export const razorpay = new Razorpay({
  key_id: ENV.RAZORPAY_KEY_ID || "",
  key_secret: ENV.RAZORPAY_KEY_SECRET || "",
});

export interface CreateOrderParams {
  amountInPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export async function createOrder(params: CreateOrderParams) {
  const options: Razorpay.OrderCreateRequestBody = {
    amount: params.amountInPaise,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/*
 Verifies Razorpay payment signature.
*/
export function verifyPaymentSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", ENV.RAZORPAY_KEY_SECRET || "")
    .update(body.toString())
    .digest("hex");

  return expectedSignature === razorpay_signature;
}
