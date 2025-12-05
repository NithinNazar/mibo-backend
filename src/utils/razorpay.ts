// src/utils/razorpay.ts
import Razorpay from "razorpay";
import crypto from "crypto";
import { ENV } from "../config/env";
import logger from "../config/logger";

/**
 * Razorpay utility for payment processing
 *
 * Setup Instructions:
 * 1. Sign up at https://razorpay.com/
 * 2. Get your API keys from Dashboard > Settings > API Keys
 * 3. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file
 */

class RazorpayUtil {
  private razorpay: Razorpay | null = null;

  constructor() {
    // Only initialize if API keys are provided
    if (ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET) {
      try {
        this.razorpay = new Razorpay({
          key_id: ENV.RAZORPAY_KEY_ID,
          key_secret: ENV.RAZORPAY_KEY_SECRET,
        });
        logger.info("✓ Razorpay initialized successfully");
      } catch (error) {
        logger.error("Failed to initialize Razorpay:", error);
      }
    } else {
      logger.warn(
        "⚠ Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payments."
      );
    }
  }

  /**
   * Check if Razorpay is configured
   */
  isConfigured(): boolean {
    return this.razorpay !== null;
  }

  /**
   * Create a Razorpay order
   * @param amount Amount in smallest currency unit (paise for INR)
   * @param currency Currency code (default: INR)
   * @param receipt Receipt ID for reference
   * @param notes Additional notes
   */
  async createOrder(
    amount: number,
    currency: string = "INR",
    receipt: string,
    notes?: Record<string, string>
  ): Promise<any> {
    if (!this.razorpay) {
      throw new Error(
        "Razorpay is not configured. Please add API keys to environment variables."
      );
    }

    try {
      const options = {
        amount: Math.round(amount), // Amount in smallest currency unit
        currency,
        receipt,
        notes: notes || {},
      };

      const order = await this.razorpay.orders.create(options);

      logger.info(`Razorpay order created: ${order.id}`);

      return order;
    } catch (error: any) {
      logger.error("Razorpay order creation failed:", error);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   * @param orderId Razorpay order ID
   * @param paymentId Razorpay payment ID
   * @param signature Razorpay signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    if (!ENV.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay key secret is not configured");
    }

    try {
      // Generate expected signature
      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", ENV.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest("hex");

      // Compare signatures
      const isValid = expectedSignature === signature;

      if (isValid) {
        logger.info(`Payment signature verified for order: ${orderId}`);
      } else {
        logger.warn(`Invalid payment signature for order: ${orderId}`);
      }

      return isValid;
    } catch (error: any) {
      logger.error("Payment signature verification failed:", error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   * @param body Webhook request body
   * @param signature Razorpay webhook signature from header
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!ENV.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay key secret is not configured");
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", ENV.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error: any) {
      logger.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  /**
   * Fetch payment details
   * @param paymentId Razorpay payment ID
   */
  async fetchPayment(paymentId: string): Promise<any> {
    if (!this.razorpay) {
      throw new Error("Razorpay is not configured");
    }

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      logger.error(`Failed to fetch payment ${paymentId}:`, error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Fetch order details
   * @param orderId Razorpay order ID
   */
  async fetchOrder(orderId: string): Promise<any> {
    if (!this.razorpay) {
      throw new Error("Razorpay is not configured");
    }

    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error: any) {
      logger.error(`Failed to fetch order ${orderId}:`, error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  /**
   * Create a refund
   * @param paymentId Razorpay payment ID
   * @param amount Amount to refund (optional, full refund if not provided)
   */
  async createRefund(paymentId: string, amount?: number): Promise<any> {
    if (!this.razorpay) {
      throw new Error("Razorpay is not configured");
    }

    try {
      const options: any = { payment_id: paymentId };
      if (amount) {
        options.amount = Math.round(amount);
      }

      const refund = await this.razorpay.payments.refund(paymentId, options);

      logger.info(`Refund created for payment: ${paymentId}`);

      return refund;
    } catch (error: any) {
      logger.error(`Failed to create refund for ${paymentId}:`, error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }
}

// Export singleton instance
export const razorpayUtil = new RazorpayUtil();
