// src/services/video.service.ts
import { videoRepository } from "../repositories/video.repository";
import { appointmentRepository } from "../repositories/appointment.repository";
import { patientRepository } from "../repositories/patient.repository";
import { googleMeetUtil } from "../utils/googleMeet";
import { ApiError } from "../utils/apiError";
import logger from "../config/logger";

export class VideoService {
  /**
   * Generate Google Meet link for appointment
   */
  async generateGoogleMeetLink(appointmentId: number): Promise<string> {
    // Check if Google Meet is configured
    if (!googleMeetUtil.isReady()) {
      throw ApiError.serviceUnavailable(
        "Video consultation service is not configured. Please contact support.",
      );
    }

    // Get appointment details
    const appointment =
      await appointmentRepository.findAppointmentById(appointmentId);

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    // Verify appointment is ONLINE type
    if (appointment.appointment_type !== "ONLINE") {
      throw ApiError.badRequest(
        "Meet link can only be generated for ONLINE appointments",
      );
    }

    // Check if Meet link already exists
    const existingLink =
      await videoRepository.getMeetLinkByAppointment(appointmentId);

    if (existingLink) {
      logger.info(`Meet link already exists for appointment ${appointmentId}`);
      return existingLink.join_url;
    }

    // Get patient details
    const patient = await patientRepository.findByUserId(
      appointment.patient_id,
    );
    if (!patient) {
      throw ApiError.notFound("Patient not found");
    }

    try {
      // Create Google Meet event
      const meetLink = await googleMeetUtil.createMeetLinkForAppointment(
        patient.user.full_name,
        appointment.clinician_name,
        patient.user.email || "",
        new Date(appointment.scheduled_start_at).toISOString(),
        new Date(appointment.scheduled_end_at).toISOString(),
      );

      // Store Meet link
      await videoRepository.storeMeetLink({
        appointment_id: appointmentId,
        join_url: meetLink,
        host_url: meetLink,
        provider: "GOOGLE_MEET",
        status: "scheduled",
        scheduled_start_at: new Date(appointment.scheduled_start_at),
        scheduled_end_at: new Date(appointment.scheduled_end_at),
      });

      logger.info(`Meet link generated for appointment ${appointmentId}`);

      return meetLink;
    } catch (error: any) {
      logger.error("Failed to generate Meet link:", error);
      throw ApiError.internal("Failed to generate video consultation link");
    }
  }

  /**
   * Get Meet link for appointment
   */
  async getMeetLinkForAppointment(appointmentId: number) {
    const appointment =
      await appointmentRepository.getAppointmentById(appointmentId);

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    const videoLink =
      await videoRepository.getMeetLinkByAppointment(appointmentId);

    if (!videoLink) {
      // Try to generate if appointment is ONLINE and doesn't have link
      if (appointment.appointment_type === "ONLINE") {
        try {
          const meetLink = await this.generateGoogleMeetLink(appointmentId);
          return {
            appointment_id: appointmentId,
            join_url: meetLink,
            host_url: meetLink,
            provider: "GOOGLE_MEET",
          };
        } catch (error) {
          throw ApiError.notFound(
            "Video link not found and could not be generated",
          );
        }
      }

      throw ApiError.notFound("Video link not found for this appointment");
    }

    return videoLink;
  }

  /**
   * Auto-generate Meet link for ONLINE appointments
   * Called during appointment creation
   */
  async autoGenerateMeetLink(appointmentId: number): Promise<string | null> {
    try {
      // Check if Google Meet is configured
      if (!googleMeetUtil.isReady()) {
        logger.warn(
          "Google Meet not configured, skipping auto-generation for appointment " +
            appointmentId,
        );
        return null;
      }

      // Get appointment details
      const appointment =
        await appointmentRepository.getAppointmentById(appointmentId);

      if (!appointment) {
        return null;
      }

      // Only generate for ONLINE appointments
      if (appointment.appointment_type !== "ONLINE") {
        return null;
      }

      // Generate Meet link
      const meetLink = await this.generateGoogleMeetLink(appointmentId);

      logger.info(`Auto-generated Meet link for appointment ${appointmentId}`);

      return meetLink;
    } catch (error: any) {
      // Log error but don't throw - appointment creation should succeed even if Meet link fails
      logger.error(
        `Failed to auto-generate Meet link for appointment ${appointmentId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Update Meet link
   */
  async updateMeetLink(appointmentId: number, meetLink: string) {
    const appointment =
      await appointmentRepository.getAppointmentById(appointmentId);

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    const existingLink =
      await videoRepository.getMeetLinkByAppointment(appointmentId);

    if (existingLink) {
      return await videoRepository.updateMeetLink(
        appointmentId,
        meetLink,
        meetLink,
      );
    } else {
      return await videoRepository.storeMeetLink({
        appointment_id: appointmentId,
        join_url: meetLink,
        host_url: meetLink,
        provider: "CUSTOM",
        status: "scheduled",
      });
    }
  }

  /**
   * Delete Meet link
   */
  async deleteMeetLink(appointmentId: number) {
    const videoLink =
      await videoRepository.getMeetLinkByAppointment(appointmentId);

    if (!videoLink) {
      throw ApiError.notFound("Video link not found");
    }

    // If it's a Google Meet link with meeting ID, we can't delete the calendar event
    // as we don't store calendar_event_id anymore
    // Just delete from database
    if (
      videoLink.provider === "GOOGLE_MEET" &&
      videoLink.meeting_id &&
      googleMeetUtil.isReady()
    ) {
      logger.warn(
        "Cannot delete Google Calendar event - meeting_id stored but no calendar_event_id",
      );
    }

    await videoRepository.deleteMeetLink(appointmentId);

    logger.info(`Meet link deleted for appointment ${appointmentId}`);
  }

  /**
   * Get all video links
   */
  async getAllVideoLinks(filters?: {
    startDate?: string;
    endDate?: string;
    provider?: string;
  }) {
    return await videoRepository.getAllVideoLinks(filters);
  }
}

export const videoService = new VideoService();
