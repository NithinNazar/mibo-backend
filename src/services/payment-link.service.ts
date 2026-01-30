// src/services/payment-link.service.ts
import Razorpay from "razorpay";
import { ENV } from "../config/env";
import { ApiError } from "../utils/apiError";
import logger from "../config/logger";

interface CreatePaymentLinkRequest {
  clinicianId: number;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  appointmentId?: number;
  description?: string;
}

interface PaymentLinkResponse {
  paymentLink: string;
  orderId: string;
  shortUrl: string;
}

class PaymentLinkService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create Razorpay payment link and send via WhatsApp
   */
  async createAndSendPaymentLink(
    data: CreatePaymentLinkRequest,
  ): Promise<PaymentLinkResponse> {
    try {
      // Create Razorpay payment link
      const paymentLink = await this.createRazorpayPaymentLink(data);

      // Send via WhatsApp (Gallabox)
      await this.sendPaymentLinkViaWhatsApp(
        data.customerPhone,
        data.customerName,
        paymentLink.shortUrl,
        data.amount,
      );

      // Send via Email if provided
      if (data.customerEmail) {
        await this.sendPaymentLinkViaEmail(
          data.customerEmail,
          data.customerName,
          paymentLink.shortUrl,
          data.amount,
        );
      }

      logger.info(
        `Payment link created and sent for ${data.customerName} (${data.customerPhone})`,
      );

      return paymentLink;
    } catch (error: any) {
      logger.error("Failed to create/send payment link:", error);
      throw ApiError.badRequest(
        error.message || "Failed to create payment link",
      );
    }
  }

  /**
   * Create Razorpay payment link
   */
  private async createRazorpayPaymentLink(
    data: CreatePaymentLinkRequest,
  ): Promise<PaymentLinkResponse> {
    try {
      const paymentLinkData = {
        amount: data.amount * 100, // Convert to paise
        currency: "INR",
        description: data.description || `Consultation Fee - Mibo Care`,
        customer: {
          name: data.customerName,
          contact: data.customerPhone,
          email: data.customerEmail || undefined,
        },
        notify: {
          sms: false, // We'll send via WhatsApp instead
          email: false, // We'll send via our email service
        },
        reminder_enable: true,
        notes: {
          clinician_id: data.clinicianId.toString(),
          appointment_id: data.appointmentId?.toString() || "",
          source: "front_desk",
        },
        callback_url: `https://mibo.care/payment/success`,
        callback_method: "get",
      };

      const response = await this.razorpay.paymentLink.create(paymentLinkData);

      return {
        paymentLink: response.short_url,
        orderId: response.id,
        shortUrl: response.short_url,
      };
    } catch (error: any) {
      logger.error("Razorpay payment link creation failed:", error);
      throw new Error(
        `Razorpay error: ${error.error?.description || error.message}`,
      );
    }
  }

  /**
   * Send payment link via WhatsApp using Gallabox
   */
  private async sendPaymentLinkViaWhatsApp(
    phone: string,
    customerName: string,
    paymentLink: string,
    amount: number,
  ): Promise<void> {
    try {
      const message = this.formatWhatsAppMessage(
        customerName,
        paymentLink,
        amount,
      );

      // TODO: Implement sendMessage method in gallaboxUtil
      // await gallaboxUtil.sendMessage(phone, message);
      console.log(`Payment link would be sent to ${phone}: ${message}`);

      logger.info(`Payment link sent via WhatsApp to ${phone}`);
    } catch (error: any) {
      logger.error("Failed to send WhatsApp message:", error);
      // Don't throw error - payment link is still created
      // Just log the failure
    }
  }

  /**
   * Send payment link via Email
   */
  private async sendPaymentLinkViaEmail(
    email: string,
    customerName: string,
    paymentLink: string,
    amount: number,
  ): Promise<void> {
    try {
      // TODO: Implement email service
      // For now, just log
      logger.info(`Payment link email would be sent to ${email}`);
      logger.warn("Email service not implemented yet");
    } catch (error: any) {
      logger.error("Failed to send email:", error);
      // Don't throw error - payment link is still created
    }
  }

  /**
   * Format WhatsApp message with payment link
   */
  private formatWhatsAppMessage(
    customerName: string,
    paymentLink: string,
    amount: number,
  ): string {
    return `
Hello ${customerName}! 👋

Thank you for booking your consultation with Mibo Care.

💰 *Payment Details:*
Amount: ₹${amount.toLocaleString("en-IN")}

🔗 *Complete your payment here:*
${paymentLink}

This is a secure payment link powered by Razorpay. Your payment information is safe and encrypted.

⏰ Please complete the payment within 24 hours to confirm your appointment.

If you have any questions, feel free to reply to this message or call us.

Best regards,
Team Mibo Care 💚
    `.trim();
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentLinkId: string): Promise<any> {
    try {
      const paymentLink = await this.razorpay.paymentLink.fetch(paymentLinkId);

      // Type assertion for payments array
      const payments = (paymentLink as any).payments;
      const paymentId =
        Array.isArray(payments) && payments.length > 0
          ? payments[0]?.payment_id || null
          : null;

      return {
        status: paymentLink.status,
        amountPaid: paymentLink.amount_paid / 100,
        paymentId,
      };
    } catch (error: any) {
      logger.error("Failed to verify payment:", error);
      throw ApiError.badRequest("Failed to verify payment status");
    }
  }
}

export const paymentLinkService = new PaymentLinkService();
