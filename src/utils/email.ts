// src/utils/email.ts
import nodemailer from "nodemailer";
import { ENV } from "../config/env";
import logger from "../config/logger";

/**
 * Email utility for sending emails via SMTP
 *
 * Setup Instructions:
 * 1. Add email configuration to .env:
 *    - EMAIL_HOST (e.g., smtp.gmail.com)
 *    - EMAIL_PORT (e.g., 587)
 *    - EMAIL_USER (your email)
 *    - EMAIL_PASSWORD (app password)
 *    - EMAIL_FROM (sender email)
 *
 * For Gmail:
 * 1. Enable 2-factor authentication
 * 2. Generate App Password: https://myaccount.google.com/apppasswords
 * 3. Use the app password in EMAIL_PASSWORD
 */

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailUtil {
  private transporter: any = null;
  private isConfigured: boolean = false;
  private fromEmail: string = "";

  constructor() {
    // Only initialize if email credentials are provided
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM;

    if (emailHost && emailPort && emailUser && emailPassword) {
      try {
        this.transporter = nodemailer.createTransport({
          host: emailHost,
          port: parseInt(emailPort),
          secure: parseInt(emailPort) === 465, // true for 465, false for other ports
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });

        this.fromEmail = emailFrom || emailUser;
        this.isConfigured = true;

        logger.info("✓ Email service initialized successfully");
      } catch (error) {
        logger.error("Failed to initialize email service:", error);
      }
    } else {
      logger.warn(
        "⚠ Email service not configured. Add EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD to enable email notifications."
      );
    }
  }

  /**
   * Check if email service is configured
   */
  isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<any> {
    if (!this.isReady()) {
      logger.warn("Email service not configured, skipping email");
      return { success: false, message: "Email service not configured" };
    }

    try {
      const mailOptions = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent to ${options.to}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        data: info,
      };
    } catch (error: any) {
      logger.error("Failed to send email:", {
        error: error.message,
        to: options.to,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send online consultation link email
   */
  async sendOnlineConsultationLink(
    to: string,
    patientName: string,
    clinicianName: string,
    meetLink: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<any> {
    const subject = `Online Consultation Link - ${appointmentDate}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎥 Online Consultation</h1>
      <p>Mibo Mental Hospital</p>
    </div>
    
    <div class="content">
      <h2>Hello ${patientName},</h2>
      
      <p>Your online consultation has been scheduled successfully!</p>
      
      <div class="info-box">
        <p><strong>📅 Date:</strong> ${appointmentDate}</p>
        <p><strong>⏰ Time:</strong> ${appointmentTime}</p>
        <p><strong>👨‍⚕️ Doctor:</strong> Dr. ${clinicianName}</p>
      </div>
      
      <p><strong>Join your consultation using the link below:</strong></p>
      
      <div style="text-align: center;">
        <a href="${meetLink}" class="button">Join Video Consultation</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        Or copy and paste this link in your browser:<br>
        <a href="${meetLink}">${meetLink}</a>
      </p>
      
      <div class="info-box">
        <p><strong>⚠️ Important Instructions:</strong></p>
        <ul>
          <li>Please join 5 minutes before the scheduled time</li>
          <li>Ensure you have a stable internet connection</li>
          <li>Use a device with camera and microphone</li>
          <li>Find a quiet, private space for the consultation</li>
        </ul>
      </div>
      
      <p>If you have any questions or need to reschedule, please contact us.</p>
      
      <p>Best regards,<br>
      <strong>Mibo Mental Hospital Team</strong></p>
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply to this email.</p>
      <p>&copy; 2024 Mibo Mental Hospital. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Hello ${patientName},

Your online consultation has been scheduled successfully!

Date: ${appointmentDate}
Time: ${appointmentTime}
Doctor: Dr. ${clinicianName}

Join your consultation using this link:
${meetLink}

Important Instructions:
- Please join 5 minutes before the scheduled time
- Ensure you have a stable internet connection
- Use a device with camera and microphone
- Find a quiet, private space for the consultation

If you have any questions or need to reschedule, please contact us.

Best regards,
Mibo Mental Hospital Team
    `;

    return await this.sendEmail({ to, subject, text, html });
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(
    to: string,
    patientName: string,
    clinicianName: string,
    appointmentDate: string,
    appointmentTime: string,
    centreName: string,
    appointmentType: string
  ): Promise<any> {
    const subject = `Appointment Confirmed - ${appointmentDate}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Appointment Confirmed</h1>
      <p>Mibo Mental Hospital</p>
    </div>
    
    <div class="content">
      <h2>Hello ${patientName},</h2>
      
      <p>Your appointment has been confirmed!</p>
      
      <div class="info-box">
        <p><strong>📅 Date:</strong> ${appointmentDate}</p>
        <p><strong>⏰ Time:</strong> ${appointmentTime}</p>
        <p><strong>👨‍⚕️ Doctor:</strong> Dr. ${clinicianName}</p>
        <p><strong>🏥 Centre:</strong> ${centreName}</p>
        <p><strong>📋 Type:</strong> ${appointmentType}</p>
      </div>
      
      <p>Please arrive 10 minutes before your scheduled time.</p>
      
      <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
      
      <p>Best regards,<br>
      <strong>Mibo Mental Hospital Team</strong></p>
    </div>
    
    <div class="footer">
      <p>This is an automated email. Please do not reply to this email.</p>
      <p>&copy; 2024 Mibo Mental Hospital. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Hello ${patientName},

Your appointment has been confirmed!

Date: ${appointmentDate}
Time: ${appointmentTime}
Doctor: Dr. ${clinicianName}
Centre: ${centreName}
Type: ${appointmentType}

Please arrive 10 minutes before your scheduled time.

If you need to reschedule or cancel, please contact us as soon as possible.

Best regards,
Mibo Mental Hospital Team
    `;

    return await this.sendEmail({ to, subject, text, html });
  }
}

// Export singleton instance
export const emailUtil = new EmailUtil();
