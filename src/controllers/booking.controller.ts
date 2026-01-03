// src/controllers/booking.controller.ts
import { Request, Response } from "express";
import { bookingService } from "../services/booking.service";
import logger from "../config/logger";

class BookingController {
  /**
   * Create appointment
   * POST /api/booking/create
   */
  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized. Please login.",
        });
        return;
      }

      const {
        clinicianId,
        centreId,
        appointmentDate,
        appointmentTime,
        appointmentType,
        notes,
      } = req.body;

      // Validate required fields
      if (
        !clinicianId ||
        !centreId ||
        !appointmentDate ||
        !appointmentTime ||
        !appointmentType
      ) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: clinicianId, centreId, appointmentDate, appointmentTime, appointmentType",
        });
        return;
      }

      // Validate appointment type
      if (appointmentType !== "ONLINE" && appointmentType !== "IN_PERSON") {
        res.status(400).json({
          success: false,
          message: "Invalid appointment type. Must be ONLINE or IN_PERSON",
        });
        return;
      }

      // Create appointment
      const result = await bookingService.createAppointment(req.user.userId, {
        clinicianId: parseInt(clinicianId),
        centreId: parseInt(centreId),
        appointmentDate,
        appointmentTime,
        appointmentType,
        notes,
      });

      res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: result,
      });
    } catch (error: any) {
      logger.error("Error creating appointment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create appointment",
      });
    }
  }

  /**
   * Get appointment details
   * GET /api/booking/:id
   */
  async getAppointment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized. Please login.",
        });
        return;
      }

      const appointmentId = parseInt(req.params.id);

      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid appointment ID",
        });
        return;
      }

      const appointment = await bookingService.getAppointmentDetails(
        appointmentId,
        req.user.userId
      );

      res.json({
        success: true,
        data: appointment,
      });
    } catch (error: any) {
      logger.error("Error getting appointment:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Appointment not found",
      });
    }
  }

  /**
   * Get patient appointments
   * GET /api/booking/my-appointments
   */
  async getMyAppointments(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized. Please login.",
        });
        return;
      }

      const { status, upcoming, limit, offset } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (upcoming === "true") filters.upcoming = true;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const result = await bookingService.getPatientAppointments(
        req.user.userId,
        filters
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Error getting appointments:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get appointments",
      });
    }
  }

  /**
   * Cancel appointment
   * POST /api/booking/:id/cancel
   */
  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized. Please login.",
        });
        return;
      }

      const appointmentId = parseInt(req.params.id);

      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid appointment ID",
        });
        return;
      }

      const { reason } = req.body;

      await bookingService.cancelAppointment(
        appointmentId,
        req.user.userId,
        reason
      );

      res.json({
        success: true,
        message: "Appointment cancelled successfully",
      });
    } catch (error: any) {
      logger.error("Error cancelling appointment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to cancel appointment",
      });
    }
  }

  /**
   * Get available time slots
   * GET /api/booking/available-slots
   */
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { clinicianId, centreId, date } = req.query;

      if (!clinicianId || !centreId || !date) {
        res.status(400).json({
          success: false,
          message: "Missing required parameters: clinicianId, centreId, date",
        });
        return;
      }

      const slots = await bookingService.getAvailableSlots(
        parseInt(clinicianId as string),
        parseInt(centreId as string),
        date as string
      );

      res.json({
        success: true,
        data: {
          date,
          slots,
        },
      });
    } catch (error: any) {
      logger.error("Error getting available slots:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get available slots",
      });
    }
  }
}

export const bookingController = new BookingController();
