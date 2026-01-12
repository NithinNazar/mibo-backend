// src/services/staff.service.ts
import { staffRepository } from "../repositories/staff.repository";
import { ApiError } from "../utils/apiError";
import {
  validateCreateStaffUser,
  validateUpdateStaffUser,
  validateCreateClinician,
  validateUpdateClinician,
  validateUpdateClinicianAvailability,
} from "../validations/staff.validation";

export class StaffService {
  /**
   * Get staff users with filtering
   */
  async getStaffUsers(roleId?: number, centreId?: number) {
    return await staffRepository.findStaffUsers({ roleId, centreId });
  }

  /**
   * Get staff by ID
   */
  async getStaffById(userId: number) {
    const staff = await staffRepository.findStaffById(userId);
    if (!staff) {
      throw ApiError.notFound("Staff user not found");
    }
    return staff;
  }

  /**
   * Create staff user with password hashing and role assignment
   */
  async createStaffUser(body: any) {
    const dto = validateCreateStaffUser(body);

    // Check if phone already exists
    const existingStaff = await staffRepository.findStaffUsers();
    const phoneExists = existingStaff.some((s: any) => s.phone === dto.phone);
    if (phoneExists) {
      throw ApiError.conflict(
        "A staff user with this phone number already exists"
      );
    }

    // Check if username already exists (if provided)
    if (dto.username) {
      const usernameExists = existingStaff.some(
        (s: any) => s.username === dto.username
      );
      if (usernameExists) {
        throw ApiError.conflict("This username is already taken");
      }
    }

    return await staffRepository.createStaffUser(
      {
        full_name: dto.full_name,
        phone: dto.phone,
        email: dto.email,
        username: dto.username,
        password: dto.password,
        designation: dto.designation,
      },
      dto.role_ids,
      dto.centre_ids
    );
  }

  /**
   * Update staff user
   */
  async updateStaffUser(userId: number, body: any) {
    const dto = validateUpdateStaffUser(body);

    // Check if staff exists
    const staff = await staffRepository.findStaffById(userId);
    if (!staff) {
      throw ApiError.notFound("Staff user not found");
    }

    return await staffRepository.updateStaffUser(userId, dto);
  }

  /**
   * Delete staff user
   */
  async deleteStaffUser(userId: number) {
    // Check if staff exists
    const staff = await staffRepository.findStaffById(userId);
    if (!staff) {
      throw ApiError.notFound("Staff user not found");
    }

    await staffRepository.deleteStaffUser(userId);
    return { message: "Staff user deleted successfully" };
  }

  /**
   * Get clinicians with filtering
   */
  async getClinicians(centreId?: number, specialization?: string) {
    return await staffRepository.findClinicians({ centreId, specialization });
  }

  /**
   * Get clinician by ID with complete details
   */
  async getClinicianById(clinicianId: number) {
    const clinician = await staffRepository.findClinicianById(clinicianId);
    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }
    return clinician;
  }

  /**
   * Create clinician with user validation
   */
  async createClinician(body: any) {
    const dto = validateCreateClinician(body);

    // Verify user exists and is a staff user
    const staff = await staffRepository.findStaffById(dto.user_id);
    if (!staff) {
      throw ApiError.badRequest(
        "User must be a staff member to become a clinician"
      );
    }

    // Check if user is already a clinician
    const existingClinicians = await staffRepository.findClinicians();
    const isAlreadyClinician = existingClinicians.some(
      (c: any) => c.user_id === dto.user_id
    );
    if (isAlreadyClinician) {
      throw ApiError.conflict("This user is already registered as a clinician");
    }

    return await staffRepository.createClinician({
      user_id: dto.user_id,
      primary_centre_id: dto.primary_centre_id,
      specialization: dto.specialization,
      registration_number: dto.registration_number,
      experience_years: dto.experience_years,
      consultation_fee: dto.consultation_fee,
      bio: dto.bio,
      consultation_modes: dto.consultation_modes,
      default_consultation_duration_minutes:
        dto.default_consultation_duration_minutes,
      profile_picture_url: dto.profile_picture_url,
    });
  }

  /**
   * Update clinician
   */
  async updateClinician(clinicianId: number, body: any) {
    const dto = validateUpdateClinician(body);

    // Check if clinician exists
    const clinician = await staffRepository.findClinicianById(clinicianId);
    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }

    return await staffRepository.updateClinician(clinicianId, dto);
  }

  /**
   * Delete clinician with appointment validation
   */
  async deleteClinician(clinicianId: number) {
    // Check if clinician exists
    const clinician = await staffRepository.findClinicianById(clinicianId);
    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }

    try {
      await staffRepository.deleteClinician(clinicianId);
      return { message: "Clinician deleted successfully" };
    } catch (error: any) {
      throw ApiError.badRequest(error.message);
    }
  }

  /**
   * Update clinician availability
   */
  async updateClinicianAvailability(clinicianId: number, body: any) {
    const dto = validateUpdateClinicianAvailability(body);

    // Check if clinician exists
    const clinician = await staffRepository.findClinicianById(clinicianId);
    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }

    return await staffRepository.updateClinicianAvailability(
      clinicianId,
      dto.availability_rules
    );
  }

  /**
   * Create front desk staff with auto-generated credentials
   */
  async createFrontDeskStaff(body: {
    full_name: string;
    phone: string;
    email?: string;
    centreId: number;
  }) {
    // Validate input
    if (!body.full_name || !body.phone || !body.centreId) {
      throw ApiError.badRequest(
        "Missing required fields: full_name, phone, centreId"
      );
    }

    // Check if phone already exists
    const existingStaff = await staffRepository.findStaffUsers();
    const phoneExists = existingStaff.some((s: any) => s.phone === body.phone);
    if (phoneExists) {
      throw ApiError.conflict(
        "A staff user with this phone number already exists"
      );
    }

    // Generate username from name (e.g., "John Doe" -> "frontdesk_john_doe")
    const nameParts = body.full_name.toLowerCase().trim().split(/\s+/);
    const baseUsername = `frontdesk_${nameParts.join("_")}`;

    // Check if username exists and add number if needed
    let username = baseUsername;
    let counter = 1;
    while (existingStaff.some((s: any) => s.username === username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate random password (8 characters: letters + numbers)
    const generatePassword = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      let password = "";
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const password = generatePassword();

    // Create staff user with FRONT_DESK role
    const result = await staffRepository.createStaffUser(
      {
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        username: username,
        password: password,
        designation: "Front Desk",
      },
      [6], // FRONT_DESK role ID (assuming 6 based on typical role setup)
      [body.centreId]
    );

    return {
      user: {
        id: result.user.id,
        full_name: result.user.full_name,
        phone: result.user.phone,
        email: result.user.email,
        username: result.user.username,
        role: "FRONT_DESK",
        centreId: body.centreId,
        isActive: result.user.is_active,
        createdAt: result.user.created_at,
      },
      credentials: {
        username: username,
        password: password, // Return plain password only once
      },
    };
  }
}

export const staffService = new StaffService();
