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
        "A staff user with this phone number already exists",
      );
    }

    // Check if username already exists (if provided)
    if (dto.username) {
      const usernameExists = existingStaff.some(
        (s: any) => s.username === dto.username,
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
      dto.centre_ids,
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
   * Supports two modes:
   * 1. Link existing user: provide user_id
   * 2. Create new user + clinician: provide full_name, phone, password, role_ids
   */
  async createClinician(body: any) {
    let userId: number;

    // Check if this is a combined user+clinician creation
    if (body.full_name && body.phone && body.password && body.role_ids) {
      // Create user first
      const userDto = validateCreateStaffUser({
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        username: body.username,
        password: body.password,
        designation:
          body.designation ||
          (Array.isArray(body.specialization)
            ? body.specialization[0]
            : "Clinician"),
        role_ids: body.role_ids,
        centre_ids: body.primary_centre_id
          ? [body.primary_centre_id]
          : body.centre_ids || [],
      });

      // Check if phone already exists
      const existingStaff = await staffRepository.findStaffUsers();
      const phoneExists = existingStaff.some(
        (s: any) => s.phone === userDto.phone,
      );
      if (phoneExists) {
        throw ApiError.conflict("Phone number already registered");
      }

      // Check if username already exists (if provided)
      if (userDto.username) {
        const usernameExists = existingStaff.some(
          (s: any) => s.username === userDto.username,
        );
        if (usernameExists) {
          throw ApiError.conflict("Username already taken");
        }
      }

      // Create the user
      const newUser = await staffRepository.createStaffUser(
        userDto,
        userDto.role_ids,
        userDto.centre_ids || [],
      );
      userId = newUser.user.id;
    } else if (body.user_id) {
      // Use existing user
      userId = body.user_id;

      // Verify user exists and is a staff user
      const staff = await staffRepository.findStaffById(userId);
      if (!staff) {
        throw ApiError.badRequest(
          "User must be a staff member to become a clinician",
        );
      }
    } else {
      throw ApiError.badRequest(
        "Either provide user_id for existing user, or full_name, phone, password, and role_ids to create new user",
      );
    }

    // Check if user is already a clinician
    const existingClinicians = await staffRepository.findClinicians();
    const isAlreadyClinician = existingClinicians.some(
      (c: any) => c.user_id === userId,
    );
    if (isAlreadyClinician) {
      throw ApiError.conflict("User already registered as clinician");
    }

    // Validate clinician data
    const clinicianDto = validateCreateClinician({
      user_id: userId,
      primary_centre_id: body.primary_centre_id,
      specialization: body.specialization,
      registration_number: body.registration_number,
      years_of_experience: body.years_of_experience || body.experience_years,
      consultation_fee: body.consultation_fee,
      bio: body.bio,
      consultation_modes: body.consultation_modes,
      default_consultation_duration_minutes:
        body.default_consultation_duration_minutes ||
        body.default_duration_minutes,
      profile_picture_url: body.profile_picture_url,
      qualification: body.qualification,
      expertise: body.expertise,
      languages: body.languages,
    });

    // Create clinician
    const clinician = await staffRepository.createClinician({
      user_id: clinicianDto.user_id,
      primary_centre_id: clinicianDto.primary_centre_id,
      specialization: clinicianDto.specialization,
      registration_number: clinicianDto.registration_number,
      years_of_experience: clinicianDto.years_of_experience,
      consultation_fee: clinicianDto.consultation_fee,
      bio: clinicianDto.bio,
      consultation_modes: clinicianDto.consultation_modes,
      default_consultation_duration_minutes:
        clinicianDto.default_consultation_duration_minutes,
      profile_picture_url: clinicianDto.profile_picture_url,
      qualification: clinicianDto.qualification,
      expertise: clinicianDto.expertise,
      languages: clinicianDto.languages,
    });

    // If availability slots provided, create them
    if (
      body.availability_slots &&
      Array.isArray(body.availability_slots) &&
      body.availability_slots.length > 0
    ) {
      try {
        await staffRepository.updateClinicianAvailability(
          clinician.id,
          body.availability_slots,
        );
      } catch (error: any) {
        // Log error but don't fail clinician creation
        console.error("Failed to create availability slots:", error.message);
      }
    }

    return clinician;
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
   * Toggle clinician active status (soft delete/activate)
   */
  async toggleClinicianActive(clinicianId: number, isActive: boolean) {
    // Check if clinician exists
    const clinician = await staffRepository.findClinicianById(clinicianId);
    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }

    return await staffRepository.toggleClinicianActive(clinicianId, isActive);
  }

  /**
   * Toggle staff active status (for all staff types)
   */
  async toggleStaffActive(userId: number, isActive: boolean) {
    const staff = await staffRepository.findStaffById(userId);
    if (!staff) {
      throw ApiError.notFound("Staff user not found");
    }

    return await staffRepository.toggleStaffActive(userId, isActive);
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
      dto.availability_rules,
    );
  }

  /**
   * Get clinician availability
   */
  async getClinicianAvailability(clinicianId: number) {
    // Check if clinician exists
    const clinician = await staffRepository.findClinicianById(clinicianId);
    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }

    return clinician.availabilityRules || [];
  }

  /**
   * Create Manager staff
   */
  async createManager(body: {
    full_name: string;
    phone: string;
    email?: string;
    username: string;
    password: string;
  }) {
    // Validate input
    if (!body.full_name || !body.phone || !body.username || !body.password) {
      throw ApiError.badRequest(
        "Missing required fields: full_name, phone, username, password",
      );
    }

    // Check if phone already exists
    const existingStaff = await staffRepository.findStaffUsers();
    const phoneExists = existingStaff.some((s: any) => s.phone === body.phone);
    if (phoneExists) {
      throw ApiError.conflict(
        "A staff user with this phone number already exists",
      );
    }

    // Check if username already exists
    const usernameExists = existingStaff.some(
      (s: any) => s.username === body.username,
    );
    if (usernameExists) {
      throw ApiError.conflict("This username is already taken");
    }

    // Create staff user with MANAGER role (role ID 2)
    const result = await staffRepository.createStaffUser(
      {
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        username: body.username,
        password: body.password,
        designation: "Manager",
      },
      [2], // MANAGER role ID
      [], // No centre assignment for managers
    );

    return {
      user: {
        id: result.user.id,
        full_name: result.user.full_name,
        phone: result.user.phone,
        email: result.user.email,
        username: result.user.username,
        role: "MANAGER",
        isActive: result.user.is_active,
        createdAt: result.user.created_at,
      },
    };
  }

  /**
   * Create Centre Manager staff
   */
  async createCentreManager(body: {
    full_name: string;
    phone: string;
    email?: string;
    username: string;
    password: string;
    centreId: number;
  }) {
    // Validate input
    if (
      !body.full_name ||
      !body.phone ||
      !body.username ||
      !body.password ||
      !body.centreId
    ) {
      throw ApiError.badRequest(
        "Missing required fields: full_name, phone, username, password, centreId",
      );
    }

    // Check if phone already exists
    const existingStaff = await staffRepository.findStaffUsers();
    const phoneExists = existingStaff.some((s: any) => s.phone === body.phone);
    if (phoneExists) {
      throw ApiError.conflict(
        "A staff user with this phone number already exists",
      );
    }

    // Check if username already exists
    const usernameExists = existingStaff.some(
      (s: any) => s.username === body.username,
    );
    if (usernameExists) {
      throw ApiError.conflict("This username is already taken");
    }

    // Create staff user with CENTRE_MANAGER role (role ID 3)
    const result = await staffRepository.createStaffUser(
      {
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        username: body.username,
        password: body.password,
        designation: "Centre Manager",
      },
      [3], // CENTRE_MANAGER role ID
      [body.centreId],
    );

    return {
      user: {
        id: result.user.id,
        full_name: result.user.full_name,
        phone: result.user.phone,
        email: result.user.email,
        username: result.user.username,
        role: "CENTRE_MANAGER",
        centreId: body.centreId,
        isActive: result.user.is_active,
        createdAt: result.user.created_at,
      },
    };
  }

  /**
   * Create Care Coordinator staff
   */
  async createCareCoordinator(body: {
    full_name: string;
    phone: string;
    email?: string;
    username: string;
    password: string;
    centreId: number;
  }) {
    // Validate input
    if (
      !body.full_name ||
      !body.phone ||
      !body.username ||
      !body.password ||
      !body.centreId
    ) {
      throw ApiError.badRequest(
        "Missing required fields: full_name, phone, username, password, centreId",
      );
    }

    // Check if phone already exists
    const existingStaff = await staffRepository.findStaffUsers();
    const phoneExists = existingStaff.some((s: any) => s.phone === body.phone);
    if (phoneExists) {
      throw ApiError.conflict(
        "A staff user with this phone number already exists",
      );
    }

    // Check if username already exists
    const usernameExists = existingStaff.some(
      (s: any) => s.username === body.username,
    );
    if (usernameExists) {
      throw ApiError.conflict("This username is already taken");
    }

    // Create staff user with CARE_COORDINATOR role (role ID 5)
    const result = await staffRepository.createStaffUser(
      {
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        username: body.username,
        password: body.password,
        designation: "Care Coordinator",
      },
      [5], // CARE_COORDINATOR role ID
      [body.centreId],
    );

    return {
      user: {
        id: result.user.id,
        full_name: result.user.full_name,
        phone: result.user.phone,
        email: result.user.email,
        username: result.user.username,
        role: "CARE_COORDINATOR",
        centreId: body.centreId,
        isActive: result.user.is_active,
        createdAt: result.user.created_at,
      },
    };
  }

  /**
   * Create Front Desk staff
   */
  async createFrontDeskStaff(body: {
    full_name: string;
    phone: string;
    email?: string;
    username: string;
    password: string;
    centreId: number;
  }) {
    // Validate input
    if (
      !body.full_name ||
      !body.phone ||
      !body.username ||
      !body.password ||
      !body.centreId
    ) {
      throw ApiError.badRequest(
        "Missing required fields: full_name, phone, username, password, centreId",
      );
    }

    // Check if phone already exists
    const existingStaff = await staffRepository.findStaffUsers();
    const phoneExists = existingStaff.some((s: any) => s.phone === body.phone);
    if (phoneExists) {
      throw ApiError.conflict(
        "A staff user with this phone number already exists",
      );
    }

    // Check if username already exists
    const usernameExists = existingStaff.some(
      (s: any) => s.username === body.username,
    );
    if (usernameExists) {
      throw ApiError.conflict("This username is already taken");
    }

    // Create staff user with FRONT_DESK role (role ID 6)
    const result = await staffRepository.createStaffUser(
      {
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        username: body.username,
        password: body.password,
        designation: "Front Desk",
      },
      [6], // FRONT_DESK role ID
      [body.centreId],
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
    };
  }

  /**
   * Get available time slots for a clinician on a specific date
   */
  async getClinicianSlots(
    clinicianId: number,
    date: string,
    centreId?: number,
  ) {
    // Check if clinician exists
    const clinician = await staffRepository.findClinicianById(clinicianId);
    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }

    // Get day of week from date (0 = Sunday, 6 = Saturday)
    const dateObj = new Date(date + "T00:00:00Z");
    const dayOfWeek = dateObj.getUTCDay();

    // Get availability rules for this day
    const availabilityRules = clinician.availabilityRules || [];
    const rulesForDay = availabilityRules.filter(
      (rule: any) =>
        rule.day_of_week === dayOfWeek &&
        rule.is_active &&
        (!centreId || Number(rule.centre_id) === centreId),
    );

    if (rulesForDay.length === 0) {
      return []; // No availability for this day
    }

    // Get booked appointments for this date
    const bookedAppointments = await staffRepository.getBookedAppointments(
      clinicianId,
      date,
      centreId,
    );

    // Generate time slots
    const slots: any[] = [];

    for (const rule of rulesForDay) {
      const slotDuration = rule.slot_duration_minutes || 30;
      const startTime = rule.start_time; // HH:mm format
      const endTime = rule.end_time; // HH:mm format

      // Parse start and end times
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;

      // Generate slots
      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMinute < endMinute)
      ) {
        const slotStartTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

        // Calculate end time for this slot
        let slotEndMinute = currentMinute + slotDuration;
        let slotEndHour = currentHour;

        if (slotEndMinute >= 60) {
          slotEndHour += Math.floor(slotEndMinute / 60);
          slotEndMinute = slotEndMinute % 60;
        }

        const slotEndTime = `${String(slotEndHour).padStart(2, "0")}:${String(slotEndMinute).padStart(2, "0")}`;

        // Check if this slot is booked
        const isBooked = bookedAppointments.some((apt: any) => {
          const aptStart = new Date(apt.scheduled_start_at);
          const aptStartTime = `${String(aptStart.getUTCHours()).padStart(2, "0")}:${String(aptStart.getUTCMinutes()).padStart(2, "0")}`;
          return aptStartTime === slotStartTime;
        });

        // Find the appointment ID if booked
        const bookedAppointment = bookedAppointments.find((apt: any) => {
          const aptStart = new Date(apt.scheduled_start_at);
          const aptStartTime = `${String(aptStart.getUTCHours()).padStart(2, "0")}:${String(aptStart.getUTCMinutes()).padStart(2, "0")}`;
          return aptStartTime === slotStartTime;
        });

        slots.push({
          clinicianId: clinicianId.toString(),
          centreId: rule.centre_id.toString(),
          date,
          startTime: slotStartTime,
          endTime: slotEndTime,
          status: isBooked ? "booked" : "available",
          appointmentId: bookedAppointment?.id?.toString(),
          mode: rule.mode,
        });

        // Move to next slot
        currentMinute += slotDuration;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }
    }

    return slots;
  }
}

export const staffService = new StaffService();
