// src/utils/caseTransform.ts

/**
 * Convert snake_case string to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/gi, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Transform object keys from snake_case to camelCase
 */
export function transformToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformToCamelCase(item)) as any;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const transformed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = snakeToCamel(key);
        transformed[camelKey] = transformToCamelCase(obj[key]);
      }
    }
    return transformed;
  }

  return obj;
}

/**
 * Transform object keys from camelCase to snake_case
 */
export function transformToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformToSnakeCase(item)) as any;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const transformed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = camelToSnake(key);
        transformed[snakeKey] = transformToSnakeCase(obj[key]);
      }
    }
    return transformed;
  }

  return obj;
}

/**
 * Transform specific clinician fields for API response
 * Handles both snake_case from DB and ensures camelCase output
 * Ensures array fields remain as arrays
 */
export function transformClinicianResponse(clinician: any): any {
  if (!clinician) return clinician;

  const transformed = transformToCamelCase(clinician);

  // Ensure specific field mappings for clinician
  if (clinician.years_of_experience !== undefined) {
    transformed.yearsOfExperience = clinician.years_of_experience;
  }
  if (clinician.primary_centre_id !== undefined) {
    transformed.primaryCentreId = clinician.primary_centre_id;
  }
  if (clinician.primary_centre_name !== undefined) {
    transformed.primaryCentreName = clinician.primary_centre_name;
  }
  if (clinician.consultation_fee !== undefined) {
    transformed.consultationFee = clinician.consultation_fee;
  }
  if (clinician.registration_number !== undefined) {
    transformed.registrationNumber = clinician.registration_number;
  }
  if (clinician.consultation_modes !== undefined) {
    transformed.consultationModes = clinician.consultation_modes;
  }
  if (clinician.default_consultation_duration_minutes !== undefined) {
    transformed.defaultDurationMinutes =
      clinician.default_consultation_duration_minutes;
  }
  if (clinician.profile_picture_url !== undefined) {
    transformed.profilePictureUrl = clinician.profile_picture_url;
  }

  // Ensure array fields are properly handled
  if (clinician.specialization !== undefined) {
    transformed.specialization = Array.isArray(clinician.specialization)
      ? clinician.specialization
      : [];
  }
  if (clinician.qualification !== undefined) {
    transformed.qualification = Array.isArray(clinician.qualification)
      ? clinician.qualification
      : [];
  }
  if (clinician.expertise !== undefined) {
    transformed.expertise = Array.isArray(clinician.expertise)
      ? clinician.expertise
      : [];
  }
  if (clinician.languages !== undefined) {
    transformed.languages = Array.isArray(clinician.languages)
      ? clinician.languages
      : [];
  }

  // Ensure user_id is mapped
  if (clinician.user_id !== undefined) {
    transformed.userId = clinician.user_id;
  }

  // Ensure is_active is mapped
  if (clinician.is_active !== undefined) {
    transformed.isActive = clinician.is_active;
  }

  // Ensure created_at and updated_at are mapped
  if (clinician.created_at !== undefined) {
    transformed.createdAt = clinician.created_at;
  }
  if (clinician.updated_at !== undefined) {
    transformed.updatedAt = clinician.updated_at;
  }

  // Ensure availability_rules are mapped
  if (clinician.availability_rules !== undefined) {
    transformed.availabilityRules = Array.isArray(clinician.availability_rules)
      ? clinician.availability_rules.map((rule: any) =>
          transformToCamelCase(rule),
        )
      : [];
  }

  return transformed;
}
