// src/services/appointment.service.ts
import { appointmentRepository } from "../repositories/appointment.repository";
import {
  validateCreateAppointment,
  validateRescheduleAppointment,
  validateUpdateStatus,
} from "../validations/appointment.validation";
import { ApiError } from "../utils/apiError";
import { AppointmentStatus } from "../types/appointment.types";
import { patientRepository } from "../repositories/patient.repository";
import { JwtPayload } from "../utils/jwt";

export class AppointmentService {
  /*
   Create appointment. 
   If userType is PATIENT, patient_id is derived from logged in user.
   If userType is STAFF, patient_id must be provided in body.
  */
  async createAppointment(body: any, authUser: JwtPayload) {
    const dto = validateCreateAppointment(body);

    let patient_id: number;

    if (authUser.userType === "PATIENT") {
      const patient = await patientRepository.findByUserId(authUser.userId);
      if (!patient) {
        throw ApiError.badRequest("Patient profile not found");
      }
      // patient.profile.id is the patient_profiles primary key
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
}

export const appointmentService = new AppointmentService();
