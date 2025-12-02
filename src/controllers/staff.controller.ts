// src/controllers/staff.controller.ts
import { Request, Response, NextFunction } from "express";
import { staffService } from "../services/staff.service";
import { ok, created } from "../utils/response";

export class StaffController {
  async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await staffService.createStaff(req.body);
      return created(res, result, "Staff created");
    } catch (err) {
      next(err);
    }
  }

  async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await staffService.assignRole(req.body);
      return created(res, result, "Role assigned");
    } catch (err) {
      next(err);
    }
  }

  async listStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await staffService.getStaffList();
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getStaffById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await staffService.getStaffById(id);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await staffService.deactivateStaff(id);
      return ok(res, result.message);
    } catch (err) {
      next(err);
    }
  }
}

export const staffController = new StaffController();
