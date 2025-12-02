// src/controllers/appointment.controller.ts
import { Response, NextFunction } from "express";
import { appointmentService } from "../services/appointment.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ok, created } from "../utils/response";

export class AppointmentController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const appt = await appointmentService.createAppointment(
        req.body,
        req.user
      );
      return created(res, appt, "Appointment created");
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const id = Number(req.params.id);
      const appt = await appointmentService.getAppointmentById(id, req.user);
      return ok(res, appt);
    } catch (err) {
      next(err);
    }
  }

  async listForCurrentPatient(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) return;
      const appts = await appointmentService.listForCurrentPatient(req.user);
      return ok(res, appts);
    } catch (err) {
      next(err);
    }
  }

  async listForClinician(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinicianId = Number(req.params.clinicianId);
      const appts = await appointmentService.listForClinician(clinicianId);
      return ok(res, appts);
    } catch (err) {
      next(err);
    }
  }

  async listForCentre(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const centreId = Number(req.params.centreId);
      const appts = await appointmentService.listForCentre(centreId);
      return ok(res, appts);
    } catch (err) {
      next(err);
    }
  }

  async reschedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const appt = await appointmentService.rescheduleAppointment(
        req.body,
        req.params,
        req.user
      );
      return ok(res, appt, "Appointment rescheduled");
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const appt = await appointmentService.updateStatus(
        req.body,
        req.params,
        req.user
      );
      return ok(res, appt, "Status updated");
    } catch (err) {
      next(err);
    }
  }
}

export const appointmentController = new AppointmentController();
