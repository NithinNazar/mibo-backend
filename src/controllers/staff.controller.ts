// src/controllers/staff.controller.ts
import { Response, NextFunction } from "express";
import { staffService } from "../services/staff.service";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";
import { transformClinicianResponse } from "../utils/caseTransform";

export class StaffController {
  /**
   * Get staff users
   */
  async getStaffUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roleId = req.query.roleId ? Number(req.query.roleId) : undefined;
      const centreId = req.query.centreId
        ? Number(req.query.centreId)
        : undefined;
      const isActive =
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined;

      const staff = await staffService.getStaffUsers(
        roleId,
        centreId,
        isActive,
      );
      return ok(res, staff);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get staff by ID
   */
  async getStaffById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const isActive =
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined;
      const staff = await staffService.getStaffById(id, isActive);
      return ok(res, staff);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create staff user
   */
  async createStaffUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const staff = await staffService.createStaffUser(req.body);
      return created(res, staff, "Staff user created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update staff user
   */
  async updateStaffUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const staff = await staffService.updateStaffUser(id, req.body);
      return ok(res, staff, "Staff user updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete staff user
   */
  async deleteStaffUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await staffService.deleteStaffUser(id);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get clinicians
   */
  async getClinicians(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const centreId = req.query.centreId
        ? Number(req.query.centreId)
        : undefined;
      const specialization = req.query.specialization
        ? String(req.query.specialization)
        : undefined;

      const isActive =
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined;

      const clinicians = await staffService.getClinicians(
        centreId,
        specialization,
        isActive,
      );

      // Transform to camelCase for frontend
      const transformed = clinicians.map(transformClinicianResponse);

      // Add caching headers for better performance
      // Cache for 5 minutes (300 seconds) to reduce server load
      res.set({
        "Cache-Control": "public, max-age=300, s-maxage=300",
        ETag: `W/"clinicians-${clinicians.length}-${Date.now()}"`,
      });

      return ok(res, transformed);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get clinician by ID
   */
  async getClinicianById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const isActive =
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined;
      const clinician = await staffService.getClinicianById(id, isActive);

      // Transform to camelCase for frontend
      const transformed = transformClinicianResponse(clinician);
      return ok(res, transformed);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create clinician
   */
  async createClinician(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinician = await staffService.createClinician(req.body);

      // Transform to camelCase for frontend
      const transformed = transformClinicianResponse(clinician);
      return created(res, transformed, "Clinician created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update clinician
   */
  async updateClinician(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const clinician = await staffService.updateClinician(id, req.body);

      // Transform to camelCase for frontend
      const transformed = transformClinicianResponse(clinician);
      return ok(res, transformed, "Clinician updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete clinician
   */
  async deleteClinician(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await staffService.deleteClinician(id);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle clinician active status
   */
  async toggleClinicianActive(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body;
      const clinician = await staffService.toggleClinicianActive(id, isActive);
      return ok(
        res,
        clinician,
        `Clinician ${isActive ? "activated" : "deactivated"} successfully`,
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle staff active status (for all staff types)
   */
  async toggleStaffActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body;

      // Check if this is a clinician path (mounted at /clinicians)
      // If so, treat id as clinician_id, otherwise as user_id
      if (req.baseUrl.includes("/clinicians")) {
        // This is a clinician toggle request
        const clinician = await staffService.toggleClinicianActive(
          id,
          isActive,
        );
        return ok(
          res,
          clinician,
          `Clinician ${isActive ? "activated" : "deactivated"} successfully`,
        );
      } else {
        // This is a generic staff toggle request
        const staff = await staffService.toggleStaffActive(id, isActive);
        return ok(
          res,
          staff,
          `Staff ${isActive ? "activated" : "deactivated"} successfully`,
        );
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update clinician availability
   */
  async updateClinicianAvailability(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = Number(req.params.id);
      const clinician = await staffService.updateClinicianAvailability(
        id,
        req.body,
      );
      return ok(res, clinician, "Clinician availability updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get clinician availability
   */
  async getClinicianAvailability(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = Number(req.params.id);
      const availability = await staffService.getClinicianAvailability(id);
      return ok(res, availability);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a specific availability rule
   */
  async deleteAvailabilityRule(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinicianId = Number(req.params.clinicianId);
      const ruleId = Number(req.params.ruleId);

      if (isNaN(clinicianId) || isNaN(ruleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid clinician ID or rule ID",
        });
      }

      await staffService.deleteAvailabilityRule(clinicianId, ruleId);
      return ok(res, null, "Availability rule deleted successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create Manager staff
   */
  async createManager(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await staffService.createManager(req.body);
      return created(res, result, "Manager created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create Centre Manager staff
   */
  async createCentreManager(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await staffService.createCentreManager(req.body);
      return created(res, result, "Centre Manager created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create Care Coordinator staff
   */
  async createCareCoordinator(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await staffService.createCareCoordinator(req.body);
      return created(res, result, "Care Coordinator created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create front desk staff
   */
  async createFrontDeskStaff(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await staffService.createFrontDeskStaff(req.body);
      return created(res, result, "Front desk staff created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get clinician time slots for a specific date
   */
  async getClinicianSlots(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const date = req.query.date as string;
      const centreId = req.query.centreId
        ? Number(req.query.centreId)
        : undefined;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date parameter is required (YYYY-MM-DD format)",
        });
      }

      const slots = await staffService.getClinicianSlots(id, date, centreId);
      return ok(res, slots);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update clinician username and password (admin only)
   * Validates: Requirements 7.4, 7.5, 7.6
   */
  async updateClinicianCredentials(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinicianId = parseInt(req.params.id);
      const { username, password } = req.body;

      if (!username && !password) {
        return res.status(400).json({
          success: false,
          message: "At least one of username or password must be provided",
        });
      }

      const updatedClinician = await staffService.updateClinicianCredentials(
        clinicianId,
        { username, password },
      );

      return ok(
        res,
        updatedClinician,
        "Clinician credentials updated successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a slot exception (block a specific slot)
   */
  async createSlotException(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinicianId = Number(req.params.clinicianId);
      const { centreId, exceptionDate, startTime, endTime, mode, reason } =
        req.body;

      if (!centreId || !exceptionDate || !startTime || !endTime || !mode) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: centreId, exceptionDate, startTime, endTime, mode",
        });
      }

      const exception = await staffService.createSlotException(
        clinicianId,
        { centreId, exceptionDate, startTime, endTime, mode, reason },
        req.user?.userId,
      );

      return created(res, exception, "Slot blocked successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get slot exceptions for a clinician
   */
  async getSlotExceptions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinicianId = Number(req.params.clinicianId);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const centreId = req.query.centreId
        ? Number(req.query.centreId)
        : undefined;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate query parameters are required",
        });
      }

      const exceptions = await staffService.getSlotExceptions(
        clinicianId,
        startDate,
        endDate,
        centreId,
      );

      return ok(res, exceptions);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a slot exception (unblock a specific slot)
   */
  async deleteSlotException(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinicianId = Number(req.params.clinicianId);
      const exceptionId = Number(req.params.exceptionId);

      if (isNaN(clinicianId) || isNaN(exceptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid clinician ID or exception ID",
        });
      }

      await staffService.deleteSlotException(clinicianId, exceptionId);
      return ok(res, null, "Slot unblocked successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete all availability rules for a specific day of week
   */
  async deleteAvailabilityRulesByDay(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinicianId = Number(req.params.clinicianId);
      const { dayOfWeek, centreId } = req.body;

      if (isNaN(clinicianId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid clinician ID",
        });
      }

      if (dayOfWeek === undefined || dayOfWeek === null) {
        return res.status(400).json({
          success: false,
          message: "dayOfWeek is required (0-6, where 0=Sunday, 6=Saturday)",
        });
      }

      const result = await staffService.deleteAvailabilityRulesByDay(
        clinicianId,
        Number(dayOfWeek),
        centreId ? Number(centreId) : undefined,
      );

      return ok(
        res,
        result,
        `Successfully deleted ${result.deletedCount} availability rule(s) for the selected day`,
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get availability rules grouped by day of week
   */
  async getAvailabilityRulesByDay(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const clinicianId = Number(req.params.clinicianId);
      const centreId = req.query.centreId
        ? Number(req.query.centreId)
        : undefined;

      if (isNaN(clinicianId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid clinician ID",
        });
      }

      const rulesByDay = await staffService.getAvailabilityRulesByDay(
        clinicianId,
        centreId,
      );

      return ok(res, rulesByDay);
    } catch (err) {
      next(err);
    }
  }
}

export const staffController = new StaffController();
