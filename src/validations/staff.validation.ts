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
  specialization: string[]; // Required array
  qualification: string[]; // Required array
  languages: string[]; // Required array
  consultation_fee: number; // Required
  registration_number?: string;
  years_of_experience?: number;
  bio?: string;
  consultation_modes?: string[]; // e.g., ['IN_PERSON', 'ONLINE']
  default_consultation_duration_minutes?: number;
  profile_picture_url?: string;
  expertise?: string[];
}

export interface UpdateClinicianDto {
  primary_centre_id?: number;
  specialization?: string[]; // Changed to array
  registration_number?: string;
  years_of_experience?: number; // Fixed: match database column name
  consultation_fee?: number;
  bio?: string;
  consultation_modes?: string[];
  default_consultation_duration_minutes?: number;
  profile_picture_url?: string;
  qualification?: string[]; // Changed to array
  expertise?: string[];
  languages?: string[];
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

  // Validate specialization as non-empty array
  if (
    !body.specialization ||
    !Array.isArray(body.specialization) ||
    body.specialization.length === 0
  ) {
    throw ApiError.badRequest(
      "specialization is required and must be a non-empty array",
    );
  }

  // Validate qualification as non-empty array
  if (
    !body.qualification ||
    !Array.isArray(body.qualification) ||
    body.qualification.length === 0
  ) {
    throw ApiError.badRequest(
      "qualification is required and must be a non-empty array",
    );
  }

  // Validate languages as non-empty array
  if (
    !body.languages ||
    !Array.isArray(body.languages) ||
    body.languages.length === 0
  ) {
    throw ApiError.badRequest(
      "languages is required and must be a non-empty array",
    );
  }

  // Validate consultation_fee is positive
  if (body.consultation_fee === undefined || body.consultation_fee === null) {
    throw ApiError.badRequest("consultation_fee is required");
  }
  const consultationFee = Number(body.consultation_fee);
  if (isNaN(consultationFee) || consultationFee <= 0) {
    throw ApiError.badRequest("consultation_fee must be a positive number");
  }

  // Validate years_of_experience is non-negative
  if (body.years_of_experience !== undefined) {
    const yearsExp = Number(body.years_of_experience);
    if (isNaN(yearsExp) || yearsExp < 0) {
      throw ApiError.badRequest(
        "years_of_experience must be a non-negative number",
      );
    }
  }

  const dto: CreateClinicianDto = {
    user_id: Number(body.user_id),
    primary_centre_id: Number(body.primary_centre_id),
    specialization: body.specialization.map((s: any) => String(s).trim()),
    qualification: body.qualification.map((q: any) => String(q).trim()),
    languages: body.languages.map((l: any) => String(l).trim()),
    consultation_fee: consultationFee,
  };

  if (body.registration_number) {
    dto.registration_number = String(body.registration_number).trim();
  }

  if (body.years_of_experience !== undefined) {
    dto.years_of_experience = Number(body.years_of_experience);
  }

  if (body.bio) {
    dto.bio = String(body.bio).trim();
  }

  // Validate consultation_modes contains only valid values
  if (body.consultation_modes) {
    if (!Array.isArray(body.consultation_modes)) {
      throw ApiError.badRequest("consultation_modes must be an array");
    }
    const validModes = ["IN_PERSON", "ONLINE"];
    const invalidModes = body.consultation_modes.filter(
      (mode: string) => !validModes.includes(mode),
    );
    if (invalidModes.length > 0) {
      throw ApiError.badRequest(
        `Invalid consultation modes: ${invalidModes.join(", ")}. Must be IN_PERSON or ONLINE`,
      );
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

  // Validate expertise as array (optional)
  if (body.expertise) {
    if (!Array.isArray(body.expertise)) {
      throw ApiError.badRequest("expertise must be an array");
    }
    dto.expertise = body.expertise.map((e: any) => String(e).trim());
  }

  return dto;
}

export function validateUpdateClinician(body: any): UpdateClinicianDto {
  const dto: UpdateClinicianDto = {};

  if (body.primary_centre_id !== undefined) {
    dto.primary_centre_id = Number(body.primary_centre_id);
  }

  // Validate specialization as array
  if (body.specialization !== undefined) {
    if (
      !Array.isArray(body.specialization) ||
      body.specialization.length === 0
    ) {
      throw ApiError.badRequest("Specialization must be a non-empty array");
    }
    dto.specialization = body.specialization.map((s: any) => String(s).trim());
  }

  if (body.registration_number !== undefined) {
    dto.registration_number = String(body.registration_number).trim();
  }

  if (body.years_of_experience !== undefined) {
    dto.years_of_experience = Number(body.years_of_experience);
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

  // Validate qualification as array
  if (body.qualification !== undefined) {
    if (!Array.isArray(body.qualification)) {
      throw ApiError.badRequest("qualification must be an array");
    }
    dto.qualification = body.qualification.map((q: any) => String(q).trim());
  }

  // Validate expertise as array
  if (body.expertise !== undefined) {
    if (!Array.isArray(body.expertise)) {
      throw ApiError.badRequest("expertise must be an array");
    }
    dto.expertise = body.expertise.map((e: any) => String(e).trim());
  }

  // Validate languages as array
  if (body.languages !== undefined) {
    if (!Array.isArray(body.languages)) {
      throw ApiError.badRequest("languages must be an array");
    }
    dto.languages = body.languages.map((l: any) => String(l).trim());
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
