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
        req.user,
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
    next: NextFunction,
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
        req.user,
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

      // If the request contains new_status or status, update status
      if (req.body.new_status || req.body.status) {
        // Normalize to new_status for consistency
        if (req.body.status && !req.body.new_status) {
          req.body.new_status = req.body.status;
        }

        const appt = await appointmentService.updateStatus(
          req.body,
          req.params,
          req.user,
        );
        return ok(res, appt, "Appointment status updated");
      }

      // If the request contains notes, update notes
      if (req.body.notes !== undefined) {
        const appointmentId = parseInt(req.params.id);
        const updatedAppointment = await appointmentService.updateNotes(
          appointmentId,
          req.body.notes,
        );
        return ok(res, updatedAppointment, "Notes updated successfully");
      }

      // Otherwise, reschedule
      const appt = await appointmentService.rescheduleAppointment(
        req.body,
        req.params,
        req.user,
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
        req.user,
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
    next: NextFunction,
  ) {
    try {
      const dto = validateAvailabilityQuery(req.query);
      const slots = await appointmentService.checkClinicianAvailability(
        dto.clinician_id,
        dto.centre_id,
        dto.date,
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
        req.user,
      );
      return created(res, appt, "Appointment created");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current clinician's appointments
   * Returns appointments categorized by: current (today), upcoming, and past
   */
  async getMyAppointments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const appointments = await appointmentService.getMyAppointments(req.user);
      return ok(
        res,
        appointments,
        "Clinician appointments retrieved successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update appointment notes
   * Validates: Requirements 5.5
   */
  async updateAppointmentNotes(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) return;

      const appointmentId = parseInt(req.params.id);
      const { notes } = req.body;

      if (notes === undefined && notes !== "") {
        return res.status(400).json({
          success: false,
          message: "Notes field is required",
        });
      }

      // Verify appointment belongs to clinician (if clinician role)
      if (req.user?.roles.includes("CLINICIAN")) {
        const appointment = await appointmentService.getAppointmentById(
          appointmentId,
          req.user,
        );
        if (!appointment) {
          return res.status(404).json({
            success: false,
            message: "Appointment not found",
          });
        }
        if (appointment.clinician_id !== req.user.clinicianId) {
          return res.status(403).json({
            success: false,
            message: "Cannot update notes for other clinician's appointments",
          });
        }
      }

      const updatedAppointment = await appointmentService.updateNotes(
        appointmentId,
        notes,
      );

      return ok(res, updatedAppointment, "Notes updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get appointment by ID with full details
   * Validates: Requirements 5.6
   */
  async getAppointmentByIdWithDetails(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) return;

      const appointmentId = parseInt(req.params.id);

      const appointment =
        await appointmentService.getAppointmentByIdWithDetails(
          appointmentId,
          req.user,
        );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Verify access for clinicians
      if (req.user?.roles.includes("CLINICIAN")) {
        if (appointment.clinician_id !== req.user.clinicianId) {
          return res.status(403).json({
            success: false,
            message: "Access denied",
          });
        }
      }

      return ok(res, appointment);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get clinician dashboard statistics
   */
  async getClinicianDashboardStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) return;

      if (!req.user.clinicianId) {
        return res.status(403).json({
          success: false,
          message: "Clinician ID not found",
        });
      }

      const startDate =
        (req.query.startDate as string) ||
        new Date().toISOString().split("T")[0];
      const endDate =
        (req.query.endDate as string) || new Date().toISOString().split("T")[0];

      const stats = await appointmentService.getClinicianDashboardStats(
        req.user.clinicianId,
        startDate,
        endDate,
      );

      return ok(res, stats);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get clinician's appointments for dashboard
   */
  async getClinicianDashboardAppointments(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) return;

      if (!req.user.clinicianId) {
        return res.status(403).json({
          success: false,
          message: "Clinician ID not found",
        });
      }

      const startDate =
        (req.query.startDate as string) ||
        new Date().toISOString().split("T")[0];
      const endDate =
        (req.query.endDate as string) || new Date().toISOString().split("T")[0];
      const status = req.query.status as string | undefined;

      const appointments =
        await appointmentService.getClinicianAppointmentsForDashboard(
          req.user.clinicianId,
          startDate,
          endDate,
          status,
        );

      return ok(res, appointments);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Start a session
   */
  async startSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const appointmentId = parseInt(req.params.id);
      const appointment = await appointmentService.startSession(
        appointmentId,
        req.user,
      );

      return ok(res, appointment, "Session started successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * End a session
   */
  async endSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const appointmentId = parseInt(req.params.id);
      const appointment = await appointmentService.endSession(
        appointmentId,
        req.user,
      );

      return ok(res, appointment, "Session completed successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save clinician notes
   */
  async saveClinicianNotes(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) return;

      const appointmentId = parseInt(req.params.id);
      const { session_notes } = req.body;

      if (!session_notes || session_notes.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Session notes are required",
        });
      }

      const note = await appointmentService.saveClinicianNotes(
        appointmentId,
        session_notes,
        req.user,
      );

      return ok(res, note, "Notes saved successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get previous session notes
   */
  async getPreviousSessionNotes(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) return;

      const appointmentId = parseInt(req.params.id);
      const patientId = parseInt(req.query.patientId as string);

      if (!req.user.clinicianId) {
        return res.status(403).json({
          success: false,
          message: "Clinician ID not found",
        });
      }

      const notes = await appointmentService.getPreviousSessionNotes(
        patientId,
        req.user.clinicianId,
        appointmentId,
      );

      return ok(res, notes);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Schedule follow-up appointment
   */
  async scheduleFollowUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const appointmentId = parseInt(req.params.id);
      const { follow_up_date, follow_up_notes } = req.body;

      if (!follow_up_date) {
        return res.status(400).json({
          success: false,
          message: "Follow-up date is required",
        });
      }

      const followUp = await appointmentService.scheduleFollowUp(
        appointmentId,
        follow_up_date,
        follow_up_notes || "",
        req.user,
      );

      return ok(res, followUp, "Follow-up scheduled successfully");
    } catch (err) {
      next(err);
    }
  }
}

export const appointmentController = new AppointmentController();
