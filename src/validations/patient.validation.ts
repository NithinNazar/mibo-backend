// src/validations/patient.validation.ts
import { ApiError } from "../utils/apiError";

export interface CreatePatientDto {
  phone: string;
  full_name: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface UpdatePatientDto {
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface AddMedicalNoteDto {
  note: string;
}

export function validateCreatePatient(body: any): CreatePatientDto {
  if (!body.phone || typeof body.phone !== "string") {
    throw ApiError.badRequest("Phone number is required");
  }

  // Validate phone format (Indian format, 10 digits)
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = body.phone.trim().replace(/\D/g, "");
  if (!phoneRegex.test(cleanPhone)) {
    throw ApiError.badRequest(
      "Invalid phone number format. Must be 10 digits starting with 6-9"
    );
  }

  if (
    !body.fullName ||
    typeof body.fullName !== "string" ||
    body.fullName.trim().length === 0
  ) {
    throw ApiError.badRequest("Full name is required");
  }

  const dto: CreatePatientDto = {
    phone: cleanPhone,
    full_name: body.fullName.trim(),
  };

  if (body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw ApiError.badRequest("Invalid email format");
    }
    dto.email = body.email.trim();
  }

  if (body.dateOfBirth) {
    dto.date_of_birth = String(body.dateOfBirth);
  }

  if (body.gender) {
    dto.gender = String(body.gender).trim();
  }

  if (body.bloodGroup) {
    dto.blood_group = String(body.bloodGroup).trim();
  }

  if (body.emergencyContactName) {
    dto.emergency_contact_name = String(body.emergencyContactName).trim();
  }

  if (body.emergencyContactPhone) {
    dto.emergency_contact_phone = String(body.emergencyContactPhone).trim();
  }

  if (body.notes) {
    dto.notes = String(body.notes).trim();
  }

  return dto;
}

export function validateUpdatePatient(body: any): UpdatePatientDto {
  const dto: UpdatePatientDto = {};

  if (body.dateOfBirth !== undefined) {
    dto.date_of_birth = String(body.dateOfBirth);
  }

  if (body.gender !== undefined) {
    dto.gender = String(body.gender).trim();
  }

  if (body.bloodGroup !== undefined) {
    dto.blood_group = String(body.bloodGroup).trim();
  }

  if (body.emergencyContactName !== undefined) {
    dto.emergency_contact_name = String(body.emergencyContactName).trim();
  }

  if (body.emergencyContactPhone !== undefined) {
    dto.emergency_contact_phone = String(body.emergencyContactPhone).trim();
  }

  if (body.notes !== undefined) {
    dto.notes = String(body.notes).trim();
  }

  if (Object.keys(dto).length === 0) {
    throw ApiError.badRequest("Nothing to update");
  }

  return dto;
}

export function validateAddMedicalNote(body: any): AddMedicalNoteDto {
  if (
    !body.note ||
    typeof body.note !== "string" ||
    body.note.trim().length === 0
  ) {
    throw ApiError.badRequest("Note text is required");
  }

  return {
    note: body.note.trim(),
  };
}
