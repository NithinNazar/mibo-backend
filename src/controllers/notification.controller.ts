// src/controllers/notification.controller.ts
import { Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ApiError } from "../utils/apiError";

export class NotificationController {
  /**
   * Send appointment confirmation
   * System use - typically called after appointment creation
   */
  async sendAppointmentConfirmation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const appointmentId = Number(req.body.appointment_id);

      if (!appointmentId) {
        throw ApiError.badRequest("appointment_id is required");
      }

      const result = await notificationService.sendAppointmentConfirmation(
        appointmentId
      );

      return ok(res, result, "Notification sent successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Send appointment reminder
   * System use - typically called by scheduled job
   */
  async sendAppointmentReminder(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const appointmentId = Number(req.body.appointment_id);

      if (!appointmentId) {
        throw ApiError.badRequest("appointment_id is required");
      }

      const result = await notificationService.sendAppointmentReminder(
        appointmentId
      );

      return ok(res, result, "Reminder sent successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get notification history
   * Admin only - view all notifications
   */
  async getNotificationHistory(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters: any = {};

      if (req.query.patientId) {
        filters.patientId = Number(req.query.patientId);
      }

      if (req.query.appointmentId) {
        filters.appointmentId = Number(req.query.appointmentId);
      }

      if (req.query.notificationType) {
        filters.notificationType = String(req.query.notificationType);
      }

      if (req.query.status) {
        filters.status = String(req.query.status);
      }

      if (req.query.startDate) {
        filters.startDate = String(req.query.startDate);
      }

      if (req.query.endDate) {
        filters.endDate = String(req.query.endDate);
      }

      if (req.query.limit) {
        filters.limit = Number(req.query.limit);
      }

      const notifications = await notificationService.getNotificationHistory(
        filters
      );

      return ok(res, notifications);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const notificationId = Number(req.params.id);

      const notification = await notificationService.getNotificationById(
        notificationId
      );

      return ok(res, notification);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const startDate = req.query.startDate
        ? String(req.query.startDate)
        : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

      const stats = await notificationService.getNotificationStats(
        startDate,
        endDate
      );

      return ok(res, stats);
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
