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
          baseURL: "https://server.gallabox.com",
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
        "⚠ Gallabox not configured. Add GALLABOX_API_KEY and GALLABOX_API_SECRET to enable WhatsApp notifications.",
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
   * Format phone number for Gallabox
   * Ensures phone number has country code (91 for India)
   * @param phone Phone number (can be 10 digits or 12 digits with country code)
   * @returns Formatted phone number with country code (e.g., 919876543210)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters (+, spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, "");

    // If phone number is 10 digits, add country code 91
    // If it's 12 digits and starts with 91, keep as is
    // If it's 13 digits and starts with 91, remove leading digit (handles +91 case)
    if (cleanPhone.length === 10) {
      return `91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      return cleanPhone;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith("91")) {
      // Handle case where +91 was converted to 91 but kept an extra digit
      return cleanPhone.substring(1);
    }

    // For any other case, return as is (shouldn't happen with valid Indian numbers)
    return cleanPhone;
  }

  /**
   * Send OTP via WhatsApp using template
   * @param phone Phone number with country code
   * @param otp OTP code to send
   */
  async sendOTP(phone: string, otp: string): Promise<any> {
    if (!this.isReady()) {
      logger.warn("Gallabox not configured, skipping WhatsApp OTP");
      return { success: false, message: "Gallabox not configured" };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Correct format as per Gallabox support
      const payload = {
        channelId: ENV.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: "User",
          phone: formattedPhone,
        },
        whatsapp: {
          type: "template",
          template: {
            templateName: "otp_verification",
            bodyValues: {
              otp: otp, // Named parameter as per template
            },
          },
        },
      };

      const response = await this.client!.post(
        "/devapi/messages/whatsapp",
        payload,
      );

      logger.info(`✅ WhatsApp OTP sent to ${formattedPhone}`);

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data,
      };
    } catch (error: any) {
      logger.error("Failed to send WhatsApp OTP:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      return {
        success: false,
        error: error.message,
      };
    }
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
      // Format phone number (ensure country code is present)
      const formattedPhone = this.formatPhoneNumber(to);

      // Try multiple payload formats for compatibility
      const payloads = [
        // Format 1: Standard Gallabox format
        {
          channelId: ENV.GALLABOX_CHANNEL_ID,
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
        },
        // Format 2: Simplified format
        {
          channelId: ENV.GALLABOX_CHANNEL_ID,
          recipient: formattedPhone,
          message: {
            type: "text",
            text: message,
          },
        },
        // Format 3: Direct format
        {
          to: formattedPhone,
          type: "text",
          message: message,
        },
      ];

      let lastError: any = null;

      // Try each format
      for (let i = 0; i < payloads.length; i++) {
        try {
          const response = await this.client!.post(
            "/devapi/messages/whatsapp",
            payloads[i],
          );

          logger.info(
            `WhatsApp message sent to ${formattedPhone} using format ${i + 1}`,
          );

          return {
            success: true,
            messageId: response.data.messageId || response.data.id,
            data: response.data,
          };
        } catch (err: any) {
          lastError = err;
          logger.warn(`Format ${i + 1} failed, trying next...`);
          continue;
        }
      }

      // All formats failed
      throw lastError;
    } catch (error: any) {
      logger.error("Failed to send WhatsApp message:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
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
    parameters: Record<string, string>,
  ): Promise<any> {
    if (!this.isReady()) {
      logger.warn("Gallabox not configured, skipping template message");
      return { success: false, message: "Gallabox not configured" };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);

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

      const response = await this.client!.post(
        "/devapi/messages/whatsapp",
        payload,
      );

      logger.info(
        `WhatsApp template message sent to ${formattedPhone}: ${templateName}`,
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
   * Send appointment confirmation message using template
   */
  async sendAppointmentConfirmation(
    phone: string,
    patientName: string,
    clinicianName: string,
    appointmentDate: string,
    appointmentTime: string,
    centreName: string,
  ): Promise<any> {
    if (!this.isReady()) {
      logger.warn("Gallabox not configured, skipping booking confirmation");
      return { success: false, message: "Gallabox not configured" };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Use the booking_conformation template
      const payload = {
        channelId: ENV.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: patientName,
          phone: formattedPhone,
        },
        whatsapp: {
          type: "template",
          template: {
            templateName: "booking_conformation",
            bodyValues: {
              "1": patientName,
              "2": clinicianName,
              "3": centreName,
              "4": appointmentDate,
              "5": appointmentTime,
              "6": "Mibo Care",
            },
          },
        },
      };

      const response = await this.client!.post(
        "/devapi/messages/whatsapp",
        payload,
      );

      logger.info(
        `✅ WhatsApp booking confirmation sent to ${formattedPhone} using template`,
      );

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data,
      };
    } catch (error: any) {
      logger.error("Failed to send booking confirmation template:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Fallback to plain text message if template fails
      logger.info("Attempting fallback to plain text message...");
      const fallbackMessage = `Hello ${patientName},

This is to confirm your appointment with Dr. ${clinicianName} at the ${centreName} centre.

The session is scheduled on ${appointmentDate} at ${appointmentTime}.

Please arrive at least 10 minutes early. If you need assistance, you can reply to this message.

Regards,
The Mibo Care team`;

      return await this.sendWhatsAppMessage(phone, fallbackMessage);
    }
  }

  /**
   * Send online consultation confirmation with Google Meet link
   * Template: online_consultation_confirmation
   * Variables: Patient Name, Doctor Name, Date, Time, Google Meet Link
   */
  async sendOnlineConsultationConfirmation(
    phone: string,
    patientName: string,
    clinicianName: string,
    appointmentDate: string,
    appointmentTime: string,
    googleMeetLink: string,
  ): Promise<any> {
    if (!this.isReady()) {
      logger.warn(
        "Gallabox not configured, skipping online consultation confirmation",
      );
      return { success: false, message: "Gallabox not configured" };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Use the online_consultation_confirmation template
      const payload = {
        channelId: ENV.GALLABOX_CHANNEL_ID,
        channelType: "whatsapp",
        recipient: {
          name: patientName,
          phone: formattedPhone,
        },
        whatsapp: {
          type: "template",
          template: {
            templateName: "online_consultation_confirmation",
            bodyValues: {
              "1": patientName,
              "2": clinicianName,
              "3": appointmentDate,
              "4": appointmentTime,
              "5": googleMeetLink,
            },
          },
        },
      };

      const response = await this.client!.post(
        "/devapi/messages/whatsapp",
        payload,
      );

      logger.info(
        `✅ WhatsApp online consultation confirmation sent to ${formattedPhone} with Google Meet link`,
      );

      return {
        success: true,
        messageId: response.data.messageId || response.data.id,
        data: response.data,
      };
    } catch (error: any) {
      logger.error(
        "Failed to send online consultation confirmation template:",
        {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        },
      );

      // Fallback to plain text message if template fails
      logger.info("Attempting fallback to plain text message...");
      const fallbackMessage = `Hello ${patientName}, your online consultation with ${clinicianName} has been successfully scheduled.

🗓️ Date: ${appointmentDate}
⏰ Time: ${appointmentTime}

Please join the session using the Google Meet link below:
${googleMeetLink}

If you face any issues, feel free to contact our support team.

We look forward to assisting you.

Regards,
The Mibo Care team`;

      return await this.sendWhatsAppMessage(phone, fallbackMessage);
    }
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
    centreName: string,
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
    reason?: string,
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
    appointmentTime: string,
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
    appointmentDate: string,
  ): Promise<any> {
    const message = `Hello ${patientName},

Your payment has been received successfully! ✅

💰 Amount: ₹${amount}
🆔 Payment ID: ${paymentId}
📅 Appointment: ${appointmentDate}

Thank you for choosing Mibo Mental Hospital.`;

    return await this.sendWhatsAppMessage(phone, message);
  }

  /**
   * Send payment link to patient
   */
  async sendPaymentLink(
    phone: string,
    patientName: string,
    amount: number,
    paymentLink: string,
    clinicianName: string,
    appointmentDate: string,
    appointmentTime: string,
  ): Promise<any> {
    const message = `Hello ${patientName},

Your appointment has been booked! 🎉

📅 Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
👨‍⚕️ Doctor: ${clinicianName}

💰 Consultation Fee: ₹${amount}

Please complete your payment to confirm the appointment:
🔗 ${paymentLink}

Payment Methods: UPI, Google Pay, PhonePe, Cards

This link is valid for 24 hours.

- Mibo Mental Hospital`;

    return await this.sendWhatsAppMessage(phone, message);
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(
    phone: string,
    patientName: string,
    amount: number,
    paymentLink: string,
    appointmentDate: string,
  ): Promise<any> {
    const message = `Hi ${patientName},

This is a reminder to complete your payment for the appointment on ${appointmentDate}.

💰 Amount: ₹${amount}
🔗 Payment Link: ${paymentLink}

Please complete the payment to confirm your appointment.

- Mibo Mental Hospital`;

    return await this.sendWhatsAppMessage(phone, message);
  }
}

// Export singleton instance
export const gallaboxUtil = new GallaboxUtil();
