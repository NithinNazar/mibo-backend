// src/services/notification.service.ts
import { notificationRepository } from "../repositories/notification.repository";
import { appointmentRepository } from "../repositories/appointment.repository";
import { patientRepository } from "../repositories/patient.repository";
import { gallaboxUtil } from "../utils/gallabox";
import { ApiError } from "../utils/apiError";
import logger from "../config/logger";

export class NotificationService {
  /**
   * Send appointment confirmation with appointment details
   */
  async sendAppointmentConfirmation(appointmentId: number) {
    try {
      // Get appointment details
      const appointment =
        await appointmentRepository.findAppointmentById(appointmentId);

      if (!appointment) {
        throw ApiError.notFound("Appointment not found");
      }

      // Get patient details
      const patient = await patientRepository.findByPatientId(appointment.patient_id);
      if (!patient) {
        throw ApiError.notFound("Patient not found");
      }

      // Format date and time
      const appointmentDate = new Date(
        appointment.scheduled_start_at,
      ).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const appointmentTime = new Date(
        appointment.scheduled_start_at,
      ).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Send WhatsApp message
      const result = await gallaboxUtil.sendAppointmentConfirmation(
        patient.user.phone,
        patient.user.full_name,
        appointment.clinician_name,
        appointmentDate,
        appointmentTime,
        appointment.centre_name,
      );

      // Log notification attempt
      await notificationRepository.createNotificationLog({
        user_id: appointment.patient_id,
        phone: patient.user.phone,
        channel: "WHATSAPP",
        payload_data: {
          appointment_id: appointmentId,
          notification_type: "APPOINTMENT_CONFIRMATION",
          message: `Appointment confirmation for ${appointmentDate} at ${appointmentTime}`,
          clinician_name: appointment.clinician_name,
          centre_name: appointment.centre_name,
        },
        status: result.success ? "SENT" : "FAILED",
        error_message: result.success ? undefined : result.error,
      });

      logger.info(
        `Appointment confirmation sent for appointment ${appointmentId}`,
      );

      return result;
    } catch (error: any) {
      logger.error("Failed to send appointment confirmation:", error);
      // Don't throw - log and continue
      return { success: false, error: error.message };
    }
  }

  /**
   * Send appointment rescheduled notification with new date/time
   */
  async sendAppointmentRescheduled(appointmentId: number) {
    try {
      const appointment =
        await appointmentRepository.findAppointmentById(appointmentId);

      if (!appointment) {
        throw ApiError.notFound("Appointment not found");
      }

      const patient = await patientRepository.findByUserId(
        appointment.patient_id,
      );
      if (!patient) {
        throw ApiError.notFound("Patient not found");
      }

      const appointmentDate = new Date(
        appointment.scheduled_start_at,
      ).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const appointmentTime = new Date(
        appointment.scheduled_start_at,
      ).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `Hello ${patient.user.full_name},

Your appointment has been rescheduled to:

📅 Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
👨‍⚕️ Doctor: ${appointment.clinician_name}
🏥 Centre: ${appointment.centre_name}

Please arrive 10 minutes before your scheduled time.

- Mibo Mental Hospital`;

      const result = await gallaboxUtil.sendWhatsAppMessage(
        patient.user.phone,
        message,
      );

      await notificationRepository.createNotificationLog({
        user_id: appointment.patient_id,
        phone: patient.user.phone,
        channel: "WHATSAPP",
        payload_data: {
          appointment_id: appointmentId,
          notification_type: "APPOINTMENT_RESCHEDULED",
          message: message,
          clinician_name: appointment.clinician_name,
          centre_name: appointment.centre_name,
        },
        status: result.success ? "SENT" : "FAILED",
        error_message: result.success ? undefined : result.error,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to send reschedule notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send appointment cancelled notification with reason
   */
  async sendAppointmentCancelled(appointmentId: number, reason?: string) {
    try {
      const appointment =
        await appointmentRepository.findAppointmentById(appointmentId);

      if (!appointment) {
        throw ApiError.notFound("Appointment not found");
      }

      const patient = await patientRepository.findByUserId(
        appointment.patient_id,
      );
      if (!patient) {
        throw ApiError.notFound("Patient not found");
      }

      const appointmentDate = new Date(
        appointment.scheduled_start_at,
      ).toLocaleDateString("en-IN");

      const appointmentTime = new Date(
        appointment.scheduled_start_at,
      ).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const result = await gallaboxUtil.sendAppointmentCancelled(
        patient.user.phone,
        patient.user.full_name,
        appointmentDate,
        appointmentTime,
        reason,
      );

      await notificationRepository.createNotificationLog({
        user_id: appointment.patient_id,
        phone: patient.user.phone,
        channel: "WHATSAPP",
        payload_data: {
          appointment_id: appointmentId,
          notification_type: "APPOINTMENT_CANCELLED",
          message: `Appointment cancelled for ${appointmentDate}`,
          reason: reason,
        },
        status: result.success ? "SENT" : "FAILED",
        error_message: result.success ? undefined : result.error,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to send cancellation notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send appointment reminder for upcoming appointments
   */
  async sendAppointmentReminder(appointmentId: number) {
    try {
      const appointment =
        await appointmentRepository.findAppointmentById(appointmentId);

      if (!appointment) {
        throw ApiError.notFound("Appointment not found");
      }

      const patient = await patientRepository.findByUserId(
        appointment.patient_id,
      );
      if (!patient) {
        throw ApiError.notFound("Patient not found");
      }

      const appointmentDate = new Date(
        appointment.scheduled_start_at,
      ).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const appointmentTime = new Date(
        appointment.scheduled_start_at,
      ).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const result = await gallaboxUtil.sendAppointmentReminder(
        patient.user.phone,
        patient.user.full_name,
        appointment.clinician_name,
        appointmentDate,
        appointmentTime,
        appointment.centre_name,
      );

      await notificationRepository.createNotificationLog({
        user_id: appointment.patient_id,
        phone: patient.user.phone,
        channel: "WHATSAPP",
        payload_data: {
          appointment_id: appointmentId,
          notification_type: "APPOINTMENT_REMINDER",
          message: `Reminder for appointment on ${appointmentDate}`,
          clinician_name: appointment.clinician_name,
          centre_name: appointment.centre_name,
        },
        status: result.success ? "SENT" : "FAILED",
        error_message: result.success ? undefined : result.error,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to send appointment reminder:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send online meeting link with Google Meet link
   */
  async sendOnlineMeetingLink(appointmentId: number, meetLink: string) {
    try {
      const appointment =
        await appointmentRepository.findAppointmentById(appointmentId);

      if (!appointment) {
        throw ApiError.notFound("Appointment not found");
      }

      const patient = await patientRepository.findByUserId(
        appointment.patient_id,
      );
      if (!patient) {
        throw ApiError.notFound("Patient not found");
      }

      const appointmentDate = new Date(
        appointment.scheduled_start_at,
      ).toLocaleDateString("en-IN");

      const appointmentTime = new Date(
        appointment.scheduled_start_at,
      ).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const result = await gallaboxUtil.sendOnlineMeetingLink(
        patient.user.phone,
        patient.user.full_name,
        meetLink,
        appointmentDate,
        appointmentTime,
      );

      await notificationRepository.createNotificationLog({
        user_id: appointment.patient_id,
        phone: patient.user.phone,
        channel: "WHATSAPP",
        payload_data: {
          appointment_id: appointmentId,
          notification_type: "MEETING_LINK",
          message: `Meeting link sent for ${appointmentDate}`,
          meet_link: meetLink,
        },
        status: result.success ? "SENT" : "FAILED",
        error_message: result.success ? undefined : result.error,
      });

      return result;
    } catch (error: any) {
      logger.error("Failed to send meeting link:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(filters?: {
    userId?: number;
    channel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    return await notificationRepository.getNotificationHistory(filters);
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: number) {
    const notification =
      await notificationRepository.getNotificationById(notificationId);

    if (!notification) {
      throw ApiError.notFound("Notification not found");
    }

    return notification;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(startDate?: string, endDate?: string) {
    return await notificationRepository.getNotificationStats(
      startDate,
      endDate,
    );
  }
}

export const notificationService = new NotificationService();
