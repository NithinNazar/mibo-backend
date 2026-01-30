// src/validations/staff.validation.ts
import { ApiError } from "../utils/apiError";

export interface CreateStaffUserDto {
  full_name: string;
  phone: string;
  email?: string;
  username?: string;
  password: string;
  designation?: string;
  role_ids: number[];
  centre_ids: number[];
}

export interface UpdateStaffUserDto {
  full_name?: string;
  phone?: string;
  email?: string;
  designation?: string;
}

export interface CreateClinicianDto {
  user_id: number;
  primary_centre_id: number;
  specialization: string;
  registration_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  bio?: string;
  consultation_modes?: string[]; // e.g., ['IN_PERSON', 'ONLINE']
  default_consultation_duration_minutes?: number;
  profile_picture_url?: string;
  qualification?: string;
  expertise?: string[];
  languages?: string[];
}

export interface UpdateClinicianDto {
  primary_centre_id?: number;
  specialization?: string;
  registration_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  bio?: string;
  consultation_modes?: string[];
  default_consultation_duration_minutes?: number;
  profile_picture_url?: string;
}

export interface AvailabilityRuleDto {
  centre_id: number; // Required: which centre this availability applies to
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  consultation_mode: string;
}

export interface UpdateClinicianAvailabilityDto {
  availability_rules: AvailabilityRuleDto[];
}

export function validateCreateStaffUser(body: any): CreateStaffUserDto {
  if (
    !body.full_name ||
    typeof body.full_name !== "string" ||
    body.full_name.trim().length === 0
  ) {
    throw ApiError.badRequest("Full name is required");
  }

  if (!body.phone || typeof body.phone !== "string") {
    throw ApiError.badRequest("Phone number is required");
  }

  // Validate phone format (Indian format, 10 digits)
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = body.phone.trim().replace(/\D/g, "");
  if (!phoneRegex.test(cleanPhone)) {
    throw ApiError.badRequest(
      "Invalid phone number format. Must be 10 digits starting with 6-9",
    );
  }

  if (
    !body.password ||
    typeof body.password !== "string" ||
    body.password.length < 8
  ) {
    throw ApiError.badRequest(
      "Password is required and must be at least 8 characters",
    );
  }

  if (
    !body.role_ids ||
    !Array.isArray(body.role_ids) ||
    body.role_ids.length === 0
  ) {
    throw ApiError.badRequest("At least one role must be assigned");
  }

  if (
    !body.centre_ids ||
    !Array.isArray(body.centre_ids) ||
    body.centre_ids.length === 0
  ) {
    throw ApiError.badRequest("At least one centre must be assigned");
  }

  const dto: CreateStaffUserDto = {
    full_name: body.full_name.trim(),
    phone: cleanPhone,
    password: body.password,
    role_ids: body.role_ids.map(Number),
    centre_ids: body.centre_ids.map(Number),
  };

  if (body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw ApiError.badRequest("Invalid email format");
    }
    dto.email = body.email.trim();
  }

  if (body.username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(body.username)) {
      throw ApiError.badRequest(
        "Username must be 3-50 alphanumeric characters",
      );
    }
    dto.username = body.username.trim();
  }

  if (body.designation) {
    dto.designation = String(body.designation).trim();
  }

  return dto;
}

export function validateUpdateStaffUser(body: any): UpdateStaffUserDto {
  const dto: UpdateStaffUserDto = {};

  if (body.full_name !== undefined) {
    if (
      typeof body.full_name !== "string" ||
      body.full_name.trim().length === 0
    ) {
      throw ApiError.badRequest("Full name cannot be empty");
    }
    dto.full_name = body.full_name.trim();
  }

  if (body.phone !== undefined) {
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = String(body.phone).trim().replace(/\D/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      throw ApiError.badRequest("Invalid phone number format");
    }
    dto.phone = cleanPhone;
  }

  if (body.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw ApiError.badRequest("Invalid email format");
    }
    dto.email = body.email.trim();
  }

  if (body.designation !== undefined) {
    dto.designation = String(body.designation).trim();
  }

  if (Object.keys(dto).length === 0) {
    throw ApiError.badRequest("Nothing to update");
  }

  return dto;
}

export function validateCreateClinician(body: any): CreateClinicianDto {
  if (!body.user_id) {
    throw ApiError.badRequest("user_id is required");
  }

  if (!body.primary_centre_id) {
    throw ApiError.badRequest("primary_centre_id is required");
  }

  if (
    !body.specialization ||
    typeof body.specialization !== "string" ||
    body.specialization.trim().length === 0
  ) {
    throw ApiError.badRequest("Specialization is required");
  }

  const dto: CreateClinicianDto = {
    user_id: Number(body.user_id),
    primary_centre_id: Number(body.primary_centre_id),
    specialization: body.specialization.trim(),
  };

  if (body.registration_number) {
    dto.registration_number = String(body.registration_number).trim();
  }

  if (body.experience_years !== undefined) {
    dto.experience_years = Number(body.experience_years);
  }

  if (body.consultation_fee !== undefined) {
    dto.consultation_fee = Number(body.consultation_fee);
  }

  if (body.bio) {
    dto.bio = String(body.bio).trim();
  }

  if (body.consultation_modes) {
    if (!Array.isArray(body.consultation_modes)) {
      throw ApiError.badRequest("consultation_modes must be an array");
    }
    const validModes = ["IN_PERSON", "ONLINE"];
    for (const mode of body.consultation_modes) {
      if (!validModes.includes(mode)) {
        throw ApiError.badRequest(
          "consultation_modes must contain only IN_PERSON or ONLINE",
        );
      }
    }
    dto.consultation_modes = body.consultation_modes;
  }

  if (body.default_consultation_duration_minutes !== undefined) {
    const duration = Number(body.default_consultation_duration_minutes);
    if (isNaN(duration) || duration < 1) {
      throw ApiError.badRequest(
        "default_consultation_duration_minutes must be at least 1",
      );
    }
    dto.default_consultation_duration_minutes = duration;
  }

  if (body.profile_picture_url) {
    dto.profile_picture_url = String(body.profile_picture_url).trim();
  }

  if (body.qualification) {
    dto.qualification = String(body.qualification).trim();
  }

  if (body.expertise) {
    if (!Array.isArray(body.expertise)) {
      throw ApiError.badRequest("expertise must be an array");
    }
    dto.expertise = body.expertise.map((e: any) => String(e).trim());
  }

  if (body.languages) {
    if (!Array.isArray(body.languages)) {
      throw ApiError.badRequest("languages must be an array");
    }
    dto.languages = body.languages.map((l: any) => String(l).trim());
  }

  return dto;
}

export function validateUpdateClinician(body: any): UpdateClinicianDto {
  const dto: UpdateClinicianDto = {};

  if (body.primary_centre_id !== undefined) {
    dto.primary_centre_id = Number(body.primary_centre_id);
  }

  if (body.specialization !== undefined) {
    if (
      typeof body.specialization !== "string" ||
      body.specialization.trim().length === 0
    ) {
      throw ApiError.badRequest("Specialization cannot be empty");
    }
    dto.specialization = body.specialization.trim();
  }

  if (body.registration_number !== undefined) {
    dto.registration_number = String(body.registration_number).trim();
  }

  if (body.experience_years !== undefined) {
    dto.experience_years = Number(body.experience_years);
  }

  if (body.consultation_fee !== undefined) {
    dto.consultation_fee = Number(body.consultation_fee);
  }

  if (body.bio !== undefined) {
    dto.bio = String(body.bio).trim();
  }

  if (body.consultation_modes !== undefined) {
    if (!Array.isArray(body.consultation_modes)) {
      throw ApiError.badRequest("consultation_modes must be an array");
    }
    const validModes = ["IN_PERSON", "ONLINE"];
    for (const mode of body.consultation_modes) {
      if (!validModes.includes(mode)) {
        throw ApiError.badRequest(
          "consultation_modes must contain only IN_PERSON or ONLINE",
        );
      }
    }
    dto.consultation_modes = body.consultation_modes;
  }

  if (body.default_consultation_duration_minutes !== undefined) {
    const duration = Number(body.default_consultation_duration_minutes);
    if (isNaN(duration) || duration < 1) {
      throw ApiError.badRequest(
        "default_consultation_duration_minutes must be at least 1",
      );
    }
    dto.default_consultation_duration_minutes = duration;
  }

  if (body.profile_picture_url !== undefined) {
    dto.profile_picture_url = String(body.profile_picture_url).trim();
  }

  if (Object.keys(dto).length === 0) {
    throw ApiError.badRequest("Nothing to update");
  }

  return dto;
}

export function validateUpdateClinicianAvailability(
  body: any,
): UpdateClinicianAvailabilityDto {
  if (!body.availability_rules || !Array.isArray(body.availability_rules)) {
    throw ApiError.badRequest("availability_rules array is required");
  }

  const rules: AvailabilityRuleDto[] = [];

  for (const rule of body.availability_rules) {
    if (!rule.centre_id) {
      throw ApiError.badRequest(
        "centre_id is required for each availability rule",
      );
    }

    if (
      rule.day_of_week === undefined ||
      rule.day_of_week < 0 ||
      rule.day_of_week > 6
    ) {
      throw ApiError.badRequest(
        "day_of_week must be between 0 (Sunday) and 6 (Saturday)",
      );
    }

    if (!rule.start_time || typeof rule.start_time !== "string") {
      throw ApiError.badRequest("start_time is required (HH:MM format)");
    }

    if (!rule.end_time || typeof rule.end_time !== "string") {
      throw ApiError.badRequest("end_time is required (HH:MM format)");
    }

    if (!rule.slot_duration_minutes || rule.slot_duration_minutes < 1) {
      throw ApiError.badRequest("slot_duration_minutes must be at least 1");
    }

    if (
      !rule.consultation_mode ||
      !["IN_PERSON", "ONLINE", "BOTH"].includes(rule.consultation_mode)
    ) {
      throw ApiError.badRequest(
        "consultation_mode must be IN_PERSON, ONLINE, or BOTH",
      );
    }

    rules.push({
      centre_id: Number(rule.centre_id),
      day_of_week: Number(rule.day_of_week),
      start_time: rule.start_time.trim(),
      end_time: rule.end_time.trim(),
      slot_duration_minutes: Number(rule.slot_duration_minutes),
      consultation_mode: rule.consultation_mode,
    });
  }

  return { availability_rules: rules };
}
