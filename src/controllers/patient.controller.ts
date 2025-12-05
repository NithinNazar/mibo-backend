// src/controllers/patient.controller.ts
import { Response, NextFunction } from "express";
import { patientService } from "../services/patient.services";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PatientController {
  /**
   * Get patients with search
   */
  async getPatients(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const phone = req.query.phone ? String(req.query.phone) : undefined;

      const patients = await patientService.getPatients(search, phone);
      return ok(res, patients);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const patient = await patientService.getPatientById(id);
      return ok(res, patient);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create patient
   */
  async createPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.createPatient(req.body);
      return created(res, patient, "Patient created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update patient
   */
  async updatePatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updated = await patientService.updatePatient(id, req.body);
      return ok(res, updated, "Patient updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number(req.params.id);
      const appointments = await patientService.getPatientAppointments(id);
      return ok(res, appointments);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add medical note
   */
  async addMedicalNote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const id = Number(req.params.id);
      const note = await patientService.addMedicalNote(
        id,
        req.body,
        req.user.userId
      );
      return created(res, note, "Medical note added successfully");
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
