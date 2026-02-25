// src/services/appointment.service.ts
import { appointmentRepository } from "../repositories/appointment.repository";
import {
  validateCreateAppointment,
  validateRescheduleAppointment,
  validateUpdateStatus,
} from "../validations/appointment.validations";
import { ApiError } from "../utils/apiError";
import { AppointmentStatus } from "../types/appointment.types";
import { patientRepository } from "../repositories/patient.repository";
import { JwtPayload } from "../utils/jwt";
import { db } from "../config/db";
import { videoService } from "./video.service";
import { notificationService } from "./notification.service";
import { paymentService } from "./payment.service";
import { emailUtil } from "../utils/email";
import { gallaboxUtil } from "../utils/gallabox";
import logger from "../config/logger";

interface AppointmentFilters {
  centreId?: number;
  clinicianId?: number;
  patientId?: number;
  date?: string;
  status?: AppointmentStatus;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export class AppointmentService {
  /**
   * Get appointments with role-based filtering
   */
  async getAppointments(filters: AppointmentFilters, authUser: JwtPayload) {
    // Apply role-based filtering
    if (authUser.userType === "PATIENT") {
      const patient = await patientRepository.findByUserId(authUser.userId);
      if (!patient) {
        throw ApiError.badRequest("Patient profile not found");
      }
      filters.patientId = patient.profile.id;
    } else if (authUser.userType === "STAFF") {
      // CLINICIAN can only see their own appointments
      if (
        authUser.roles.includes("CLINICIAN") &&
        !authUser.roles.includes("ADMIN") &&
        !authUser.roles.includes("MANAGER")
      ) {
        // Get clinician profile ID from user
        const clinicianProfile = await this.getClinicianProfileByUserId(
          authUser.userId,
        );
        if (clinicianProfile) {
          filters.clinicianId = clinicianProfile.id;
        }
      }
      // CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK can only see their centre's appointments
      else if (
        (authUser.roles.includes("CENTRE_MANAGER") ||
          authUser.roles.includes("CARE_COORDINATOR") ||
          authUser.roles.includes("FRONT_DESK")) &&
        !authUser.roles.includes("ADMIN") &&
        !authUser.roles.includes("MANAGER")
      ) {
        // Apply centre filtering based on user's assigned centres
        // For now, use the filter if provided
      }
      // ADMIN and MANAGER can see all appointments
    }

    return await appointmentRepository.findAppointments(filters);
  }

  /**
   * Get clinician profile by user ID (helper method)
   */
  private async getClinicianProfileByUserId(
    userId: number,
  ): Promise<{ id: number } | null> {
    const result = await db.oneOrNone<{ id: number }>(
      "SELECT id FROM clinician_profiles WHERE user_id = $1 AND is_active = TRUE",
      [userId],
    );
    return result;
  }
  /**
   * Create appointment with availability checking and conflict detection
   * If userType is PATIENT, patient_id is derived from logged in user.
   * If userType is STAFF, patient_id must be provided in body.
   */
  async createAppointment(body: any, authUser: JwtPayload) {
    const dto = validateCreateAppointment(body);

    let patient_id: number;

    if (authUser.userType === "PATIENT") {
      const patient = await patientRepository.findByUserId(authUser.userId);
      if (!patient) {
        throw ApiError.badRequest("Patient profile not found");
      }
      patient_id = patient.profile.id;
    } else {
      if (!dto.patient_id) {
        throw ApiError.badRequest(
          "patient_id is required when staff creates an appointment",
        );
      }
      const patient = await patientRepository.findByPatientId(dto.patient_id);
      if (!patient) {
        throw ApiError.badRequest("Target patient not found");
      }
      patient_id = patient.profile.id;
    }

    const start = new Date(dto.scheduled_start_at);
    const duration = dto.duration_minutes || 30;
    const end = new Date(start.getTime() + duration * 60000);

    // Check clinician availability rules
    // const dateStr = start.toISOString().split("T")[0];
    const dateStr = start.toLocaleDateString("en-CA",{timeZone: "Asia/Kolkata"});
    const availabilityRules =
      await appointmentRepository.getClinicianAvailabilityRules(
        dto.clinician_id,
        dateStr,
      );

    if (availabilityRules.length === 0) {
      throw ApiError.badRequest(
        "Clinician is not available on the selected day",
      );
    }

    const toMinutes = (timeStr:string) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};
    // Verify the requested time falls within availability rules
    // const requestedTime = start.toTimeString().substring(0, 5); // HH:MM format
    const requestedTime = start.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
    const requestedMinutes = toMinutes(requestedTime);
    const isWithinAvailability = availabilityRules.some((rule) => {
      const startMinutes = toMinutes(rule.start_time);
      const endMinutes = toMinutes(rule.end_time);
      return requestedMinutes >= startMinutes && requestedMinutes < endMinutes;
    });

    if (!isWithinAvailability) {
      throw ApiError.badRequest(
        "Requested time is outside clinician's availability hours",
      );
    }

    // Check for scheduling conflicts
    const hasConflict = await appointmentRepository.checkSchedulingConflicts(
      dto.clinician_id,
      start.toISOString(),
      end.toISOString(),
    );

    if (hasConflict) {
      throw ApiError.conflict(
        "Scheduling conflict detected. The clinician has an overlapping appointment.",
      );
    }

    // Determine booking source
    let source: string = "WEB_PATIENT";
    if (authUser.userType === "STAFF") {
      if (authUser.roles.includes("FRONT_DESK")) source = "ADMIN_FRONT_DESK";
      else if (authUser.roles.includes("CARE_COORDINATOR"))
        source = "ADMIN_CARE_COORDINATOR";
      else source = "ADMIN_MANAGER";
    }

    const appointment = await appointmentRepository.createAppointment({
      patient_id,
      clinician_id: dto.clinician_id,
      centre_id: dto.centre_id,
      appointment_type: dto.appointment_type,
      scheduled_start_at: start.toISOString(),
      scheduled_end_at: end.toISOString(),
      duration_minutes: duration,
      status: "BOOKED",
      parent_appointment_id: dto.parent_appointment_id || null,
      booked_by_user_id: authUser.userId,
      source: source as any,
      notes: dto.notes || null,
    });

    // Get patient and clinician details for notifications and payment
    const patient = await patientRepository.findByPatientId(patient_id);
    const clinician = await db.oneOrNone(
      `SELECT u.full_name FROM clinician_profiles cp 
       JOIN users u ON cp.user_id = u.id 
       WHERE cp.id = $1`,
      [appointment.clinician_id],
    );

    if (!patient || !clinician) {
      logger.error(
        `Patient or clinician not found for appointment ${appointment.id}`,
      );
      return appointment;
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

    const clinicianName = clinician.full_name;

    // If appointment type is ONLINE, generate Google Meet link and send notifications
    if (dto.appointment_type === "ONLINE") {
      try {
        // Generate Google Meet link
        const meetLink = await videoService.autoGenerateMeetLink(
          appointment.id,
        );

        if (meetLink) {
          logger.info(
            `Google Meet link generated for appointment ${appointment.id}`,
          );

          // Send notifications in parallel (don't wait for all to complete)
          Promise.all([
            // 1. Send WhatsApp to patient with Meet link
            gallaboxUtil
              .sendOnlineMeetingLinkTemplate(
                patient.user.phone,
                patient.user.full_name,
                meetLink,
                appointmentDate,
                appointmentTime,
                clinicianName,
                appointment.id
              )
              .catch((err) =>
                logger.error("Failed to send WhatsApp to patient:", err),
              ),

            // 2. Send email to patient with Meet link (if email exists)
            patient.user.email
              ? emailUtil
                  .sendOnlineConsultationLink(
                    patient.user.email,
                    patient.user.full_name,
                    clinicianName,
                    meetLink,
                    appointmentDate,
                    appointmentTime,
                  )
                  .catch((err) =>
                    logger.error("Failed to send email to patient:", err),
                  )
              : Promise.resolve(),

            // 3. Send WhatsApp to doctor with appointment details
            this.notifyDoctorAboutOnlineConsultation(
              appointment.clinician_id,
              patient.user.full_name,
              appointmentDate,
              appointmentTime,
              meetLink,
              appointment.id
            ).catch((err) => logger.error("Failed to notify doctor:", err)),

            // 4. Notify admins and managers
            this.notifyAdminsAboutOnlineConsultation(
              appointment.id,
              patient.user.full_name,
              clinicianName,
              appointmentDate,
              appointmentTime,
            ).catch((err) => logger.error("Failed to notify admins:", err)),
          ]).catch((err) => {
            logger.error("Error in notification promises:", err);
          });

          logger.info(
            `All notifications sent for online consultation ${appointment.id}`,
          );
        }
      } catch (error: any) {
        logger.error(
          `Failed to generate Meet link or send notifications for appointment ${appointment.id}:`,
          error,
        );
        // Don't throw - appointment creation should succeed even if notifications fail
      }
    } else {
      // For non-online appointments, send regular confirmation
      try {
        await notificationService.sendAppointmentConfirmation(appointment.id);
      } catch (error: any) {
        logger.error(
          `Failed to send confirmation for appointment ${appointment.id}:`,
          error,
        );
      }
    }

    // Generate and send payment link for all appointments (both ONLINE and IN_PERSON)
    // This happens AFTER appointment creation and notifications
    try {
      logger.info(
        `Generating payment link for appointment ${appointment.id}...`,
      );

      const paymentLinkResult = await paymentService.sendPaymentLink(
        appointment.id,
        patient.user.phone,
        patient.user.full_name,
      );

      logger.info(
        `✅ Payment link generated and sent for appointment ${appointment.id}: ${paymentLinkResult.paymentLink}`,
      );

      // Add payment link info to appointment response
      (appointment as any).paymentLink = paymentLinkResult.paymentLink;
      (appointment as any).paymentLinkSent = paymentLinkResult.whatsappSent;
      (appointment as any).paymentAmount = paymentLinkResult.amount;
    } catch (error: any) {
      logger.error(
        `Failed to generate payment link for appointment ${appointment.id}:`,
        error,
      );
      // Don't throw - appointment creation should succeed even if payment link fails
      (appointment as any).paymentLinkError = error.message;
    }

    return appointment;
  }

  async getAppointmentById(id: number, authUser: JwtPayload) {
    const appt = await appointmentRepository.getAppointmentById(id);
    if (!appt) {
      throw ApiError.notFound("Appointment not found");
    }

    // Basic access control
    if (authUser.userType === "PATIENT") {
      const patient = await patientRepository.findByUserId(authUser.userId);
      if (!patient || patient.profile.id !== appt.patient_id) {
        throw ApiError.forbidden("You do not have access to this appointment");
      }
    } else if (authUser.userType === "STAFF") {
      if (
        !authUser.roles.includes("ADMIN") &&
        !authUser.roles.includes("MANAGER") &&
        !authUser.roles.includes("CENTRE_MANAGER") &&
        !authUser.roles.includes("CARE_COORDINATOR") &&
        !authUser.roles.includes("FRONT_DESK") &&
        !authUser.roles.includes("CLINICIAN")
      ) {
        throw ApiError.forbidden("You do not have access to this appointment");
      }
    }

    return appt;
  }

  async listForCurrentPatient(authUser: JwtPayload) {
    if (authUser.userType !== "PATIENT") {
      throw ApiError.forbidden(
        "Only patients can view their appointments here",
      );
    }
    const patient = await patientRepository.findByUserId(authUser.userId);
    if (!patient) {
      throw ApiError.badRequest("Patient profile not found");
    }
    const appointments = await appointmentRepository.listAppointmentsForPatient(
      patient.profile.id,
    );
    return appointments;
  }

  async listForClinician(clinicianId: number) {
    return await appointmentRepository.listAppointmentsForClinician(
      clinicianId,
    );
  }

  /**
   * Get current clinician's appointments (for logged-in doctor)
   * Returns appointments categorized by: current (today), upcoming, and past
   */
  async getMyAppointments(authUser: JwtPayload) {
    if (authUser.userType !== "STAFF") {
      throw ApiError.forbidden("Only staff users can access this endpoint");
    }

    if (!authUser.roles.includes("CLINICIAN")) {
      throw ApiError.forbidden("Only clinicians can view their appointments");
    }

    // Get clinician profile
    const clinicianProfile = await this.getClinicianProfileByUserId(
      authUser.userId,
    );

    if (!clinicianProfile) {
      throw ApiError.notFound("Clinician profile not found");
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    // Get current appointments (today)
    const currentAppointments = await db.any(
      `
      SELECT 
        a.*,
        p.full_name as patient_name,
        p.phone as patient_phone,
        c.name as centre_name,
        c.address as centre_address
      FROM appointments a
      JOIN patient_profiles p ON a.patient_id = p.id
      JOIN centres c ON a.centre_id = c.id
      WHERE a.clinician_id = $1
        AND a.scheduled_start_at >= $2
        AND a.scheduled_start_at <= $3
        AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
        AND a.is_active = TRUE
      ORDER BY a.scheduled_start_at ASC
      `,
      [clinicianProfile.id, todayStart, todayEnd],
    );

    // Get upcoming appointments (future, not today)
    const upcomingAppointments = await db.any(
      `
      SELECT 
        a.*,
        p.full_name as patient_name,
        p.phone as patient_phone,
        c.name as centre_name,
        c.address as centre_address
      FROM appointments a
      JOIN patient_profiles p ON a.patient_id = p.id
      JOIN centres c ON a.centre_id = c.id
      WHERE a.clinician_id = $1
        AND a.scheduled_start_at > $2
        AND a.status NOT IN ('CANCELLED', 'NO_SHOW', 'COMPLETED')
        AND a.is_active = TRUE
      ORDER BY a.scheduled_start_at ASC
      LIMIT 50
      `,
      [clinicianProfile.id, todayEnd],
    );

    // Get past appointments (completed or in the past)
    const pastAppointments = await db.any(
      `
      SELECT 
        a.*,
        p.full_name as patient_name,
        p.phone as patient_phone,
        c.name as centre_name,
        c.address as centre_address
      FROM appointments a
      JOIN patient_profiles p ON a.patient_id = p.id
      JOIN centres c ON a.centre_id = c.id
      WHERE a.clinician_id = $1
        AND (
          a.scheduled_start_at < $2
          OR a.status = 'COMPLETED'
        )
        AND a.is_active = TRUE
      ORDER BY a.scheduled_start_at DESC
      LIMIT 50
      `,
      [clinicianProfile.id, todayStart],
    );

    return {
      current: currentAppointments,
      upcoming: upcomingAppointments,
      past: pastAppointments,
      summary: {
        currentCount: currentAppointments.length,
        upcomingCount: upcomingAppointments.length,
        pastCount: pastAppointments.length,
      },
    };
  }

  async listForCentre(centreId: number) {
    return await appointmentRepository.listAppointmentsForCentre(centreId);
  }

  async rescheduleAppointment(body: any, params: any, authUser: JwtPayload) {
    const dto = validateRescheduleAppointment(body, params);

    const start = new Date(dto.scheduled_start_at);
    const duration = dto.duration_minutes || 30;
    const end = new Date(start.getTime() + duration * 60000);

    const updated = await appointmentRepository.rescheduleAppointment({
      appointment_id: dto.appointment_id,
      scheduled_start_at: start.toISOString(),
      scheduled_end_at: end.toISOString(),
      duration_minutes: duration,
      changed_by_user_id: authUser.userId,
    });

    return updated;
  }

  async updateStatus(body: any, params: any, authUser: JwtPayload) {
    const dto = validateUpdateStatus(body, params);

    // Additional business rules can be added here, for example:
    // preventing moving from COMPLETED back to BOOKED, etc.

    const updated = await appointmentRepository.updateStatus(
      dto.appointment_id,
      dto.new_status,
      authUser.userId,
      dto.reason,
    );

    return updated;
  }

  /**
   * Cancel appointment with reason recording
   */
  async cancelAppointment(
    appointmentId: number,
    reason: string,
    authUser: JwtPayload,
  ) {
    const appointment =
      await appointmentRepository.getAppointmentById(appointmentId);
    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    if (appointment.status === "CANCELLED") {
      throw ApiError.badRequest("Appointment is already cancelled");
    }

    if (appointment.status === "COMPLETED") {
      throw ApiError.badRequest("Cannot cancel a completed appointment");
    }

    const updated = await appointmentRepository.updateStatus(
      appointmentId,
      "CANCELLED",
      authUser.userId,
      reason,
    );

    // TODO: Send WhatsApp cancellation notification

    return updated;
  }

  /**
   * Check clinician availability and generate available time slots
   */
  async checkClinicianAvailability(
    clinicianId: number,
    centreId: number,
    date: string,
  ): Promise<TimeSlot[]> {
    // Get availability rules for the clinician on this day
    const availabilityRules =
      await appointmentRepository.getClinicianAvailabilityRules(
        clinicianId,
        date,
      );

    if (availabilityRules.length === 0) {
      return [];
    }

    const slots: TimeSlot[] = [];

    // Generate time slots for each availability rule
    for (const rule of availabilityRules) {
      const startTime = this.parseTime(rule.start_time);
      const endTime = this.parseTime(rule.end_time);
      const slotDuration = rule.slot_duration_minutes;

      let currentTime = startTime;

      while (currentTime + slotDuration <= endTime) {
        const slotStart = this.formatTime(currentTime);
        const slotEnd = this.formatTime(currentTime + slotDuration);

        // Create datetime strings for conflict checking
        const slotStartDateTime = `${date}T${slotStart}:00`;
        const slotEndDateTime = `${date}T${slotEnd}:00`;

        // Check if this slot has a conflict
        const hasConflict =
          await appointmentRepository.checkSchedulingConflicts(
            clinicianId,
            slotStartDateTime,
            slotEndDateTime,
          );

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: !hasConflict,
        });

        currentTime += slotDuration;
      }
    }

    return slots;
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format minutes since midnight to time string (HH:MM)
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Notify doctor about online consultation
   */
  private async notifyDoctorAboutOnlineConsultation(
    clinicianId: number,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    meetLink: string,
    appointmentId: number
  ): Promise<void> {
    try {
      // Get clinician's user details
      const clinician = await db.oneOrNone(
        `
        SELECT u.phone, u.email, u.full_name
        FROM clinician_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.id = $1 AND cp.is_active = TRUE
        `,
        [clinicianId],
      );

      if (!clinician) {
        logger.warn(`Clinician ${clinicianId} not found for notification`);
        return;
      }

      // Send WhatsApp to doctor
      if (clinician.phone) {
        await gallaboxUtil.sendOnlineMeetingLinkTemplateToDoctor(clinician.phone, patientName, meetLink, appointmentDate, appointmentTime, clinician.full_name, appointmentId);
        logger.info(`WhatsApp sent to doctor ${clinician.full_name}`);
      }

      // Send email to doctor (if configured)
      if (clinician.email && emailUtil.isReady()) {
        await emailUtil.sendOnlineConsultationLink(
          clinician.email,
          clinician.full_name,
          patientName,
          meetLink,
          appointmentDate,
          appointmentTime,
        );
        logger.info(`Email sent to doctor ${clinician.full_name}`);
      }
    } catch (error: any) {
      logger.error("Failed to notify doctor:", error);
      throw error;
    }
  }

  /**
   * Notify admins and managers about online consultation
   */
  private async notifyAdminsAboutOnlineConsultation(
    appointmentId: number,
    patientName: string,
    clinicianName: string,
    appointmentDate: string,
    appointmentTime: string,
  ): Promise<void> {
    try {
      // Get all ADMIN and MANAGER users
      const admins = await db.any(
        `
        SELECT DISTINCT u.phone, u.email, u.full_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('ADMIN', 'MANAGER')
          AND u.is_active = TRUE
          AND ur.is_active = TRUE
          AND u.phone IS NOT NULL
        `,
      );

      if (admins.length === 0) {
        logger.warn("No admins/managers found for notification");
        return;
      }

      const message = `🔔 New Online Consultation Booked

👤 Patient: ${patientName}
👨‍⚕️ Doctor: Dr. ${clinicianName}
📅 Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
🆔 Appointment ID: ${appointmentId}

Google Meet link has been sent to patient and doctor.

- Mibo Mental Hospital Admin`;

      // Send WhatsApp to all admins/managers
      const notifications = admins.map((admin) =>
        gallaboxUtil
          .sendWhatsAppMessage(admin.phone, message)
          .catch((err) =>
            logger.error(`Failed to notify admin ${admin.full_name}:`, err),
          ),
      );

      await Promise.all(notifications);
      logger.info(
        `Notified ${admins.length} admins/managers about appointment ${appointmentId}`,
      );
    } catch (error: any) {
      logger.error("Failed to notify admins:", error);
      throw error;
    }
  }
}

export const appointmentService = new AppointmentService();
