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
        !authUser.roles.includes("ADMIN")
      ) {
        // Get clinician profile ID from user
        // For now, we'll need to add this logic when we have clinician repository
        // filters.clinicianId = clinicianId;
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
          "patient_id is required when staff creates an appointment"
        );
      }
      const patient = await patientRepository.findById(dto.patient_id);
      if (!patient) {
        throw ApiError.badRequest("Target patient not found");
      }
      patient_id = patient.profile.id;
    }

    const start = new Date(dto.scheduled_start_at);
    const duration = dto.duration_minutes || 30;
    const end = new Date(start.getTime() + duration * 60000);

    // Check clinician availability rules
    const dateStr = start.toISOString().split("T")[0];
    const availabilityRules =
      await appointmentRepository.getClinicianAvailabilityRules(
        dto.clinician_id,
        dateStr
      );

    if (availabilityRules.length === 0) {
      throw ApiError.badRequest(
        "Clinician is not available on the selected day"
      );
    }

    // Verify the requested time falls within availability rules
    const requestedTime = start.toTimeString().substring(0, 5); // HH:MM format
    const isWithinAvailability = availabilityRules.some((rule) => {
      return requestedTime >= rule.start_time && requestedTime < rule.end_time;
    });

    if (!isWithinAvailability) {
      throw ApiError.badRequest(
        "Requested time is outside clinician's availability hours"
      );
    }

    // Check for scheduling conflicts
    const hasConflict = await appointmentRepository.checkSchedulingConflicts(
      dto.clinician_id,
      start.toISOString(),
      end.toISOString()
    );

    if (hasConflict) {
      throw ApiError.conflict(
        "Scheduling conflict detected. The clinician has an overlapping appointment."
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

    // TODO: If appointment type is ONLINE, generate Google Meet link
    // TODO: Send WhatsApp confirmation notification

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
        "Only patients can view their appointments here"
      );
    }
    const patient = await patientRepository.findByUserId(authUser.userId);
    if (!patient) {
      throw ApiError.badRequest("Patient profile not found");
    }
    const appointments = await appointmentRepository.listAppointmentsForPatient(
      patient.profile.id
    );
    return appointments;
  }

  async listForClinician(clinicianId: number) {
    return await appointmentRepository.listAppointmentsForClinician(
      clinicianId
    );
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
      dto.reason
    );

    return updated;
  }

  /**
   * Cancel appointment with reason recording
   */
  async cancelAppointment(
    appointmentId: number,
    reason: string,
    authUser: JwtPayload
  ) {
    const appointment = await appointmentRepository.getAppointmentById(
      appointmentId
    );
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
      reason
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
    date: string
  ): Promise<TimeSlot[]> {
    // Get availability rules for the clinician on this day
    const availabilityRules =
      await appointmentRepository.getClinicianAvailabilityRules(
        clinicianId,
        date
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
            slotEndDateTime
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
}

export const appointmentService = new AppointmentService();
