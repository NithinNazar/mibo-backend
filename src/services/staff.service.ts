// src/services/staff.service.ts
import { staffRepository } from "../repositories/staff.repository";
import { ApiError } from "../utils/apiError";
import {
  validateCreateStaff,
  validateAssignRole,
} from "../validations/staff.validation";

export class StaffService {
  async createStaff(body: any) {
    const dto = validateCreateStaff(body);
    return await staffRepository.createStaffUser(
      dto.full_name,
      dto.phone,
      dto.designation
    );
  }

  async assignRole(body: any) {
    const dto = validateAssignRole(body);
    return await staffRepository.assignRole(
      dto.user_id,
      dto.role_id,
      dto.centre_id,
      dto.is_primary
    );
  }

  async getStaffList() {
    return await staffRepository.getStaffList();
  }

  async getStaffById(userId: number) {
    const data = await staffRepository.getStaffById(userId);
    if (!data) throw ApiError.notFound("Staff not found");
    return data;
  }

  async deactivateStaff(userId: number) {
    await staffRepository.deactivateStaff(userId);
    return { message: "Staff deactivated" };
  }
}

export const staffService = new StaffService();
