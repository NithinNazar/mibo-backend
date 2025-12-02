// src/validations/staff.validation.ts
import { ApiError } from "../utils/apiError";

export interface CreateStaffDto {
  full_name: string;
  phone: string;
  user_type: "STAFF";
  designation?: string;
}

export interface AssignRoleDto {
  user_id: number;
  role_id: number;
  centre_id?: number | null;
  is_primary?: boolean;
}

export function validateCreateStaff(body: any): CreateStaffDto {
  if (!body.full_name || typeof body.full_name !== "string") {
    throw ApiError.badRequest("Full name is required");
  }
  if (!body.phone || typeof body.phone !== "string") {
    throw ApiError.badRequest("Phone number is required");
  }

  return {
    full_name: body.full_name.trim(),
    phone: body.phone.trim(),
    user_type: "STAFF",
    designation: body.designation || null,
  };
}

export function validateAssignRole(body: any): AssignRoleDto {
  if (!body.user_id || !body.role_id) {
    throw ApiError.badRequest("user_id and role_id are required");
  }

  return {
    user_id: Number(body.user_id),
    role_id: Number(body.role_id),
    centre_id: body.centre_id ? Number(body.centre_id) : null,
    is_primary: body.is_primary ? Boolean(body.is_primary) : false,
  };
}
