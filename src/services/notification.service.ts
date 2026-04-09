// src/services/notification.service.ts
import { notificationRepository } from "../repositories/notification.repository";
import { appointmentRepository } from "../repositories/appointment.repository";
import { patientRepository } from "../repositories/patient.repository";
import { patientNotificationRepository } from "../repositories/patient-notification.repository";
import { gallaboxUtil } from "../utils/gallabox";
import { ApiError } from "../utils/apiError";
import logger from "../config/logger";
import {
  AffectedPatient,
  BlockedSlot,
  NotificationFilters,
} from "../types/slot-blocking.types";

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
      const patient = await patientRepository.findByPatientId(
        appointment.patient_id,
      );
      if (!patient) {
        throw ApiError.notFound("Patient not found");
      }

      const userTimezone = "Asia/Kolkata";
      // Format date and time
      const appointmentDate = new Date(
        appointment.scheduled_start_at,
      ).toLocaleDateString("en-IN", {
        timeZone: userTimezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const appointmentTime = new Date(
        appointment.scheduled_start_at,
      ).toLocaleTimeString("en-IN", {
        timeZone: userTimezone,
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

  /**
   * Create blocking notification for patient dashboard
   * Called when a slot is blocked and appointment is cancelled
   */
  async createBlockingNotification(
    patient: AffectedPatient,
    blockedSlot: BlockedSlot,
    reason: string,
  ): Promise<void> {
    try {
      // Format appointment date and time
      const appointmentDate = new Date(patient.appointment_time);
      const formattedDate = appointmentDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = appointmentDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Build notification message
      let message = `Your appointment with ${patient.clinician_name} on ${formattedDate} at ${formattedTime} has been cancelled due to ${reason}.`;

      // Add refund information if applicable
      if (patient.refund_eligible) {
        message += " Your payment will be refunded within 5-7 business days.";
      }

      message += " Please reschedule at your convenience.";

      // Create patient dashboard notification
      await patientNotificationRepository.createNotification({
        patient_id: patient.patient_id,
        notification_type: "APPOINTMENT_BLOCKED",
        title: "Appointment Cancelled",
        message,
        appointment_id: patient.appointment_id,
        blocked_slot_id: blockedSlot.id,
        metadata: {
          clinician_name: patient.clinician_name,
          appointment_date: formattedDate,
          appointment_time: formattedTime,
          reason,
          refund_eligible: patient.refund_eligible,
        },
      });

      logger.info(
        `✅ Dashboard notification created for patient ${patient.patient_id}`,
      );

      // Optionally send WhatsApp notification as well
      try {
        await gallaboxUtil.sendAppointmentCancelled(
          patient.patient_phone,
          patient.patient_name,
          formattedDate,
          formattedTime,
          reason,
        );
      } catch (whatsappError) {
        logger.error("Failed to send WhatsApp notification:", whatsappError);
        // Don't throw - dashboard notification is primary
      }
    } catch (error: any) {
      logger.error("Error creating blocking notification:", error);
      throw error;
    }
  }

  /**
   * Get patient notifications for dashboard
   */
  async getPatientNotifications(
    patientId: number,
    filters?: NotificationFilters,
  ) {
    try {
      const notifications =
        await patientNotificationRepository.getNotificationsByPatient(
          patientId,
          filters,
        );

      const total = await patientNotificationRepository.getNotificationCount(
        patientId,
        filters,
      );

      const unreadCount =
        await patientNotificationRepository.getUnreadCount(patientId);

      return {
        notifications,
        total,
        unread_count: unreadCount,
      };
    } catch (error: any) {
      logger.error("Error getting patient notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    notificationId: number,
    patientId: number,
  ): Promise<void> {
    try {
      await patientNotificationRepository.markAsRead(notificationId, patientId);
      logger.info(
        `✅ Notification ${notificationId} marked as read for patient ${patientId}`,
      );
    } catch (error: any) {
      logger.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Get unread notification count for patient
   */
  async getUnreadNotificationCount(patientId: number): Promise<number> {
    try {
      return await patientNotificationRepository.getUnreadCount(patientId);
    } catch (error: any) {
      logger.error("Error getting unread notification count:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
