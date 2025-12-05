// src/utils/gallabox.ts
import axios, { AxiosInstance } from "axios";
import { ENV } from "../config/env";
import logger from "../config/logger";

/**
 * Gallabox utility for WhatsApp messaging
 *
 * Setup Instructions:
 * 1. Sign up at https://gallabox.com/
 * 2. Get your API credentials from Dashboard > Settings > API
 * 3. Add GALLABOX_API_KEY and GALLABOX_API_SECRET to your .env file
 * 4. Connect your WhatsApp Business Account
 */

interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., 919876543210)
  message: string;
}

interface TemplateMessage {
  to: string;
  templateName: string;
  parameters: Record<string, string>;
}

class GallaboxUtil {
  private client: AxiosInstance | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Only initialize if API keys are provided
    if (ENV.GALLABOX_API_KEY && ENV.GALLABOX_API_SECRET) {
      try {
        this.client = axios.create({
          baseURL: ENV.GALLABOX_BASE_URL,
          headers: {
            "Content-Type": "application/json",
            apiKey: ENV.GALLABOX_API_KEY,
            apiSecret: ENV.GALLABOX_API_SECRET,
          },
          timeout: 10000, // 10 seconds
        });

        this.isConfigured = true;
        logger.info("✓ Gallabox initialized successfully");
      } catch (error) {
        logger.error("Failed to initialize Gallabox:", error);
      }
    } else {
      logger.warn(
        "⚠ Gallabox not configured. Add GALLABOX_API_KEY and GALLABOX_API_SECRET to enable WhatsApp notifications."
      );
    }
  }

  /**
   * Check if Gallabox is configured
   */
  isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Send plain text WhatsApp message
   * @param to Phone number with country code (e.g., 919876543210)
   * @param message Message text
   */
  async sendWhatsAppMessage(to: string, message: string): Promise<any> {
    if (!this.isReady()) {
      logger.warn("Gallabox not configured, skipping WhatsApp message");
      return { success: false, message: "Gallabox not configured" };
    }

    try {
      // Format phone number (remove + and spaces)
      const formattedPhone = to.replace(/[+\s-]/g, "");

      const payload = {
        channelId: formattedPhone,
        channelType: "whatsapp",
        recipient: {
          name: "User",
          phone: formattedPhone,
        },
        whatsapp: {
          type: "text",
          text: {
            body: message,
          },
        },
      };

      const response = await this.client!.post("/messages/whatsapp", payload);

      logger.info(`WhatsApp message sent to ${formattedPhone}`);

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data,
      };
    } catch (error: any) {
      logger.error("Failed to send WhatsApp message:", {
        error: error.message,
        response: error.response?.data,
      });

      // Don't throw error - log and continue
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send template-based WhatsApp message
   * @param to Phone number with country code
   * @param templateName Template name configured in Gallabox
   * @param parameters Template parameters
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: Record<string, string>
  ): Promise<any> {
    if (!this.isReady()) {
      logger.warn("Gallabox not configured, skipping template message");
      return { success: false, message: "Gallabox not configured" };
    }

    try {
      const formattedPhone = to.replace(/[+\s-]/g, "");

      // Convert parameters to array format expected by WhatsApp
      const parameterArray = Object.values(parameters).map((value) => ({
        type: "text",
        text: value,
      }));

      const payload = {
        channelId: formattedPhone,
        channelType: "whatsapp",
        recipient: {
          name: "User",
          phone: formattedPhone,
        },
        whatsapp: {
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "en", // or "hi" for Hindi
            },
            components: [
              {
                type: "body",
                parameters: parameterArray,
              },
            ],
          },
        },
      };

      const response = await this.client!.post("/messages/whatsapp", payload);

      logger.info(
        `WhatsApp template message sent to ${formattedPhone}: ${templateName}`
      );

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data,
      };
    } catch (error: any) {
      logger.error("Failed to send template message:", {
        error: error.message,
        response: error.response?.data,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send appointment confirmation message
   */
  async sendAppointmentConfirmation(
    phone: string,
    patientName: string,
    clinicianName: string,
    appointmentDate: string,
    appointmentTime: string,
    centreName: string
  ): Promise<any> {
    const message = `Hello ${patientName},

Your appointment has been confirmed! 🎉

📅 Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
👨‍⚕️ Doctor: ${clinicianName}
🏥 Centre: ${centreName}

Please arrive 10 minutes before your scheduled time.

For any changes, please contact us.

- Mibo Mental Hospital`;

    return await this.sendWhatsAppMessage(phone, message);
  }

  /**
   * Send appointment reminder message
   */
  async sendAppointmentReminder(
    phone: string,
    patientName: string,
    clinicianName: string,
    appointmentDate: string,
    appointmentTime: string,
    centreName: string
  ): Promise<any> {
    const message = `Hi ${patientName},

This is a reminder for your upcoming appointment:

📅 Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
👨‍⚕️ Doctor: ${clinicianName}
🏥 Centre: ${centreName}

Please arrive 10 minutes early.

- Mibo Mental Hospital`;

    return await this.sendWhatsAppMessage(phone, message);
  }

  /**
   * Send appointment cancellation message
   */
  async sendAppointmentCancelled(
    phone: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    reason?: string
  ): Promise<any> {
    const message = `Hello ${patientName},

Your appointment scheduled for:
📅 ${appointmentDate} at ⏰ ${appointmentTime}

has been cancelled.${reason ? `\n\nReason: ${reason}` : ""}

To reschedule, please contact us or book through our website.

- Mibo Mental Hospital`;

    return await this.sendWhatsAppMessage(phone, message);
  }

  /**
   * Send online meeting link
   */
  async sendOnlineMeetingLink(
    phone: string,
    patientName: string,
    meetLink: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<any> {
    const message = `Hello ${patientName},

Your online consultation is scheduled for:
📅 ${appointmentDate} at ⏰ ${appointmentTime}

Join the meeting using this link:
🔗 ${meetLink}

Please join 5 minutes before the scheduled time.

- Mibo Mental Hospital`;

    return await this.sendWhatsAppMessage(phone, message);
  }

  /**
   * Send payment confirmation message
   */
  async sendPaymentConfirmation(
    phone: string,
    patientName: string,
    amount: number,
    paymentId: string,
    appointmentDate: string
  ): Promise<any> {
    const message = `Hello ${patientName},

Your payment has been received successfully! ✅

💰 Amount: ₹${amount}
🆔 Payment ID: ${paymentId}
📅 Appointment: ${appointmentDate}

Thank you for choosing Mibo Mental Hospital.`;

    return await this.sendWhatsAppMessage(phone, message);
  }
}

// Export singleton instance
export const gallaboxUtil = new GallaboxUtil();
