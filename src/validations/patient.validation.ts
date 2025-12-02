// src/validations/patient.validation.ts
import { ApiError } from "../utils/apiError";

export interface UpdatePatientDto {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface CreatePatientDto {
  phone: string;
  full_name?: string;
}

export function validateCreatePatient(body: any): CreatePatientDto {
  if (!body.phone || typeof body.phone !== "string") {
    throw ApiError.badRequest("Phone number is required");
  }

  return {
    phone: body.phone.trim(),
    full_name: body.full_name ? String(body.full_name).trim() : "Patient",
  };
}

export function validateUpdatePatient(body: any): UpdatePatientDto {
  const allowed = [
    "full_name",
    "date_of_birth",
    "gender",
    "blood_group",
    "emergency_contact_name",
    "emergency_contact_phone",
  ];

  const dto: any = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      dto[key] = String(body[key]).trim();
    }
  }

  if (Object.keys(dto).length === 0) {
    throw ApiError.badRequest("Nothing to update");
  }

  return dto;
}
