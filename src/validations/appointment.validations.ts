// src/validations/appointment.validation.ts
import { ApiError } from "../utils/apiError";
import { AppointmentType, AppointmentStatus } from "../types/appointment.types";

export interface CreateAppointmentDto {
  patient_id?: number; // if staff creates
  clinician_id: number;
  centre_id: number;
  appointment_type: AppointmentType;
  scheduled_start_at: string; // ISO string
  duration_minutes?: number;
  notes?: string;
  parent_appointment_id?: number;
}

export interface RescheduleAppointmentDto {
  appointment_id: number;
  scheduled_start_at: string; // ISO string
  duration_minutes?: number;
}

export interface UpdateStatusDto {
  appointment_id: number;
  new_status: AppointmentStatus;
  reason?: string;
}

export interface CancelAppointmentDto {
  appointment_id: number;
  reason: string;
}

export interface AvailabilityQueryDto {
  clinician_id: number;
  centre_id: number;
  date: string; // YYYY-MM-DD format
}

const allowedTypes: AppointmentType[] = [
  "IN_PERSON",
  "ONLINE",
  "INPATIENT_ASSESSMENT",
  "FOLLOW_UP",
];

const allowedStatuses: AppointmentStatus[] = [
  "BOOKED",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export function validateCreateAppointment(body: any): CreateAppointmentDto {
  if (!body.clinician_id) {
    throw ApiError.badRequest("clinician_id is required");
  }
  if (!body.centre_id) {
    throw ApiError.badRequest("centre_id is required");
  }
  if (!body.appointment_type || !allowedTypes.includes(body.appointment_type)) {
    throw ApiError.badRequest("Invalid appointment_type");
  }
  if (!body.scheduled_start_at) {
    throw ApiError.badRequest("scheduled_start_at is required");
  }

  const start = new Date(body.scheduled_start_at);
  if (Number.isNaN(start.getTime())) {
    throw ApiError.badRequest(
      "scheduled_start_at must be a valid ISO datetime string"
    );
  }

  const dto: CreateAppointmentDto = {
    clinician_id: Number(body.clinician_id),
    centre_id: Number(body.centre_id),
    appointment_type: body.appointment_type,
    scheduled_start_at: start.toISOString(),
  };

  if (body.patient_id) dto.patient_id = Number(body.patient_id);
  if (body.duration_minutes)
    dto.duration_minutes = Number(body.duration_minutes);
  if (body.notes) dto.notes = String(body.notes);
  if (body.parent_appointment_id)
    dto.parent_appointment_id = Number(body.parent_appointment_id);

  return dto;
}

export function validateRescheduleAppointment(
  body: any,
  params: any
): RescheduleAppointmentDto {
  const appointment_id = Number(params.id);
  if (!appointment_id) {
    throw ApiError.badRequest("Invalid appointment id");
  }
  if (!body.scheduled_start_at) {
    throw ApiError.badRequest("scheduled_start_at is required");
  }
  const start = new Date(body.scheduled_start_at);
  if (Number.isNaN(start.getTime())) {
    throw ApiError.badRequest(
      "scheduled_start_at must be a valid ISO datetime string"
    );
  }

  const dto: RescheduleAppointmentDto = {
    appointment_id,
    scheduled_start_at: start.toISOString(),
  };

  if (body.duration_minutes)
    dto.duration_minutes = Number(body.duration_minutes);

  return dto;
}

export function validateUpdateStatus(body: any, params: any): UpdateStatusDto {
  const appointment_id = Number(params.id);
  if (!appointment_id) {
    throw ApiError.badRequest("Invalid appointment id");
  }

  const new_status = body.new_status as AppointmentStatus;
  if (!allowedStatuses.includes(new_status)) {
    throw ApiError.badRequest("Invalid status");
  }

  const dto: UpdateStatusDto = {
    appointment_id,
    new_status,
  };

  if (body.reason) dto.reason = String(body.reason);

  return dto;
}

export function validateCancelAppointment(
  body: any,
  params: any
): CancelAppointmentDto {
  const appointment_id = Number(params.id);
  if (!appointment_id) {
    throw ApiError.badRequest("Invalid appointment id");
  }

  if (
    !body.reason ||
    typeof body.reason !== "string" ||
    body.reason.trim().length === 0
  ) {
    throw ApiError.badRequest("Cancellation reason is required");
  }

  return {
    appointment_id,
    reason: body.reason.trim(),
  };
}

export function validateAvailabilityQuery(query: any): AvailabilityQueryDto {
  if (!query.clinician_id) {
    throw ApiError.badRequest("clinician_id is required");
  }

  if (!query.centre_id) {
    throw ApiError.badRequest("centre_id is required");
  }

  if (!query.date) {
    throw ApiError.badRequest("date is required");
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(query.date)) {
    throw ApiError.badRequest("date must be in YYYY-MM-DD format");
  }

  const date = new Date(query.date);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest("Invalid date");
  }

  return {
    clinician_id: Number(query.clinician_id),
    centre_id: Number(query.centre_id),
    date: query.date,
  };
}
