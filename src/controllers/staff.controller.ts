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

      const staff = await staffService.getStaffUsers(roleId, centreId);
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
      const staff = await staffService.getStaffById(id);
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

      const clinicians = await staffService.getClinicians(
        centreId,
        specialization,
      );

      // Transform to camelCase for frontend
      const transformed = clinicians.map(transformClinicianResponse);
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
      const clinician = await staffService.getClinicianById(id);

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
      const staff = await staffService.toggleStaffActive(id, isActive);
      return ok(
        res,
        staff,
        `Staff ${isActive ? "activated" : "deactivated"} successfully`,
      );
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
}

export const staffController = new StaffController();
