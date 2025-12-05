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
        "Video consultation service is not configured. Please contact support."
      );
    }

    // Get appointment details
    const appointment = await appointmentRepository.findAppointmentById(
      appointmentId
    );

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    // Verify appointment is ONLINE type
    if (appointment.appointment_type !== "ONLINE") {
      throw ApiError.badRequest(
        "Meet link can only be generated for ONLINE appointments"
      );
    }

    // Check if Meet link already exists
    const existingLink = await videoRepository.getMeetLinkByAppointment(
      appointmentId
    );

    if (existingLink) {
      logger.info(`Meet link already exists for appointment ${appointmentId}`);
      return existingLink.meet_link;
    }

    // Get patient details
    const patient = await patientRepository.findById(appointment.patient_id);
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
        new Date(appointment.scheduled_end_at).toISOString()
      );

      // Store Meet link
      await videoRepository.storeMeetLink({
        appointment_id: appointmentId,
        meet_link: meetLink,
        provider: "GOOGLE_MEET",
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
    const appointment = await appointmentRepository.getAppointmentById(
      appointmentId
    );

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    const videoLink = await videoRepository.getMeetLinkByAppointment(
      appointmentId
    );

    if (!videoLink) {
      // Try to generate if appointment is ONLINE and doesn't have link
      if (appointment.appointment_type === "ONLINE") {
        try {
          const meetLink = await this.generateGoogleMeetLink(appointmentId);
          return {
            appointment_id: appointmentId,
            meet_link: meetLink,
            provider: "GOOGLE_MEET",
          };
        } catch (error) {
          throw ApiError.notFound(
            "Video link not found and could not be generated"
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
            appointmentId
        );
        return null;
      }

      // Get appointment details
      const appointment = await appointmentRepository.getAppointmentById(
        appointmentId
      );

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
        error
      );
      return null;
    }
  }

  /**
   * Update Meet link
   */
  async updateMeetLink(appointmentId: number, meetLink: string) {
    const appointment = await appointmentRepository.getAppointmentById(
      appointmentId
    );

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    const existingLink = await videoRepository.getMeetLinkByAppointment(
      appointmentId
    );

    if (existingLink) {
      return await videoRepository.updateMeetLink(appointmentId, meetLink);
    } else {
      return await videoRepository.storeMeetLink({
        appointment_id: appointmentId,
        meet_link: meetLink,
        provider: "CUSTOM",
      });
    }
  }

  /**
   * Delete Meet link
   */
  async deleteMeetLink(appointmentId: number) {
    const videoLink = await videoRepository.getMeetLinkByAppointment(
      appointmentId
    );

    if (!videoLink) {
      throw ApiError.notFound("Video link not found");
    }

    // If it's a Google Meet link with event ID, try to delete the calendar event
    if (
      videoLink.provider === "GOOGLE_MEET" &&
      videoLink.calendar_event_id &&
      googleMeetUtil.isReady()
    ) {
      try {
        await googleMeetUtil.deleteCalendarEvent(videoLink.calendar_event_id);
      } catch (error) {
        logger.error("Failed to delete calendar event:", error);
        // Continue with database deletion even if calendar deletion fails
      }
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
