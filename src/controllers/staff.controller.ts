// src/controllers/staff.controller.ts
import { Response, NextFunction } from "express";
import { staffService } from "../services/staff.service";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

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
        specialization
      );
      return ok(res, clinicians);
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
      return ok(res, clinician);
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
      return created(res, clinician, "Clinician created successfully");
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
      return ok(res, clinician, "Clinician updated successfully");
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
   * Update clinician availability
   */
  async updateClinicianAvailability(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number(req.params.id);
      const clinician = await staffService.updateClinicianAvailability(
        id,
        req.body
      );
      return ok(res, clinician, "Clinician availability updated successfully");
    } catch (err) {
      next(err);
    }
  }
}

export const staffController = new StaffController();
