// src/controllers/patient.controller.ts
import { Request, Response, NextFunction } from "express";
import { patientService } from "../services/patient.service";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PatientController {
  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const data = await patientService.getPatientByUserId(req.user.userId);
      return ok(res, data);
    } catch (err) {
      next(err);
    }
  }

  async updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const updated = await patientService.updatePatient(
        req.user.userId,
        req.body
      );
      return ok(res, updated, "Profile updated");
    } catch (err) {
      next(err);
    }
  }

  async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await patientService.getPatientById(id);
      return ok(res, data);
    } catch (err) {
      next(err);
    }
  }

  async createPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const createdPatient = await patientService.createPatient(req.body);
      return created(res, createdPatient, "Patient created");
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
