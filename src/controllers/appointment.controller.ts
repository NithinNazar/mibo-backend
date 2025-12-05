// src/controllers/appointment.controller.ts
import { Response, NextFunction } from "express";
import { appointmentService } from "../services/appointment.services";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ok, created } from "../utils/response";
import {
  validateAvailabilityQuery,
  validateCancelAppointment,
} from "../validations/appointment.validations";
import { AppointmentStatus } from "../types/appointment.types";

export class AppointmentController {
  /**
   * Get appointments with query filters
   */
  async getAppointments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const filters: any = {};

      if (req.query.centreId) {
        filters.centreId = Number(req.query.centreId);
      }
      if (req.query.clinicianId) {
        filters.clinicianId = Number(req.query.clinicianId);
      }
      if (req.query.patientId) {
        filters.patientId = Number(req.query.patientId);
      }
      if (req.query.date) {
        filters.date = String(req.query.date);
      }
      if (req.query.status) {
        filters.status = String(req.query.status) as AppointmentStatus;
      }

      const appointments = await appointmentService.getAppointments(
        filters,
        req.user
      );
      return ok(res, appointments);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) return;
      const id = Number(req.params.id);
      const appt = await appointmentService.getAppointmentById(id, req.user);
      return ok(res, appt);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create appointment
   */
  async createAppointment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const appt = await appointmentService.createAppointment(
        req.body,
        req.user
      );
      return created(res, appt, "Appointment created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update appointment (reschedule or update status)
   */
  async updateAppointment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      // If the request contains new_status, update status
      if (req.body.new_status) {
        const appt = await appointmentService.updateStatus(
          req.body,
          req.params,
          req.user
        );
        return ok(res, appt, "Appointment status updated");
      }

      // Otherwise, reschedule
      const appt = await appointmentService.rescheduleAppointment(
        req.body,
        req.params,
        req.user
      );
      return ok(res, appt, "Appointment rescheduled successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const dto = validateCancelAppointment(req.body, req.params);
      await appointmentService.cancelAppointment(
        dto.appointment_id,
        dto.reason,
        req.user
      );
      return ok(res, null, "Appointment cancelled successfully");
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
    next: NextFunction
  ) {
    try {
      const dto = validateAvailabilityQuery(req.query);
      const slots = await appointmentService.checkClinicianAvailability(
        dto.clinician_id,
        dto.centre_id,
        dto.date
      );
      return ok(res, slots);
    } catch (err) {
      next(err);
    }
  }
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
}

export const appointmentController = new AppointmentController();
