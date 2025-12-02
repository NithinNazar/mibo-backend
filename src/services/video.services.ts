// src/services/video.service.ts
import { appointmentRepository } from "../repositories/appointment.repository";
import { videoRepository } from "../repositories/video.repository";
import { createGoogleMeetEvent } from "../utils/googleMeet";
import { ApiError } from "../utils/apiError";
import { JwtPayload } from "../utils/jwt";
import { patientRepository } from "../repositories/patient.repository";
import { notificationService } from "./notification.service";

export class VideoService {
  /*
   Ensures there is a Google Meet link for an ONLINE appointment.
   If already exists, returns existing.
   If not, creates a new Meet event and video_session record.
  */
  async ensureMeetForAppointment(appointmentId: number, authUser: JwtPayload) {
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) {
      throw ApiError.notFound("Appointment not found");
    }

    if (appt.appointment_type !== "ONLINE") {
      throw ApiError.badRequest(
        "Meet link is only available for online appointments"
      );
    }

    if (authUser.userType === "PATIENT") {
      const patient = await patientRepository.findByUserId(authUser.userId);
      if (!patient || patient.profile.id !== appt.patient_id) {
        throw ApiError.forbidden("You do not have access to this appointment");
      }
    }

    const existingSession = await videoRepository.getByAppointmentId(
      appointmentId
    );
    if (existingSession && existingSession.join_url) {
      return existingSession;
    }

    const start = new Date(appt.scheduled_start_at);
    const end = new Date(appt.scheduled_end_at);

    const title = `Mibo Consultation - Appointment #${appt.id}`;
    const description = `Online consultation for patient ${appt.patient_id} with clinician ${appt.clinician_id}.`;

    const meet = await createGoogleMeetEvent({
      summary: title,
      description,
      start,
      end,
    });

    const session = await videoRepository.createSession({
      appointment_id: appt.id,
      meeting_id: meet.eventId,
      join_url: meet.hangoutLink,
      host_url: meet.hangoutLink,
      status: "SCHEDULED",
      scheduled_start_at: start,
      scheduled_end_at: end,
    });

    if (meet.hangoutLink) {
      await notificationService.sendGoogleMeetLink(appt.id, meet.hangoutLink);
    }

    return session;
  }

  /*
   Returns video session details for an appointment, with access control.
  */
  async getSessionForAppointment(appointmentId: number, authUser: JwtPayload) {
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) {
      throw ApiError.notFound("Appointment not found");
    }

    if (authUser.userType === "PATIENT") {
      const patient = await patientRepository.findByUserId(authUser.userId);
      if (!patient || patient.profile.id !== appt.patient_id) {
        throw ApiError.forbidden("You do not have access to this appointment");
      }
    }

    const session = await videoRepository.getByAppointmentId(appointmentId);
    if (!session) {
      throw ApiError.notFound("Video session not found");
    }

    return session;
  }
}

export const videoService = new VideoService();
