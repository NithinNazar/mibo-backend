// src/controllers/patient-notification.controller.ts
import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { patientRepository } from "../repositories/patient.repository";
import logger from "../config/logger";
import { NotificationFilters } from "../types/slot-blocking.types";

class PatientNotificationController {
  /**
   * Get patient notifications
   * GET /api/patient/notifications
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized. Please login.",
          },
        });
        return;
      }

      // Get patient profile
      const patient = await patientRepository.findPatientProfileByUserId(
        req.user.userId,
      );

      if (!patient) {
        res.status(404).json({
          success: false,
          error: {
            code: "PATIENT_NOT_FOUND",
            message: "Patient profile not found",
          },
        });
        return;
      }

      // Parse query parameters
      const {
        limit,
        offset,
        unread_only,
        date_from,
        date_to,
        notification_type,
      } = req.query;

      const filters: NotificationFilters = {};
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);
      if (unread_only === "true") filters.unread_only = true;
      if (date_from) filters.date_from = date_from as string;
      if (date_to) filters.date_to = date_to as string;
      if (notification_type)
        filters.notification_type = notification_type as any;

      // Get notifications
      const result = await notificationService.getPatientNotifications(
        patient.id,
        filters,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Error getting patient notifications:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to get notifications",
        },
      });
    }
  }

  /**
   * Mark notification as read
   * PUT /api/patient/notifications/:notificationId/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized. Please login.",
          },
        });
        return;
      }

      // Get patient profile
      const patient = await patientRepository.findPatientProfileByUserId(
        req.user.userId,
      );

      if (!patient) {
        res.status(404).json({
          success: false,
          error: {
            code: "PATIENT_NOT_FOUND",
            message: "Patient profile not found",
          },
        });
        return;
      }

      const notificationId = parseInt(req.params.notificationId);

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_NOTIFICATION_ID",
            message: "Invalid notification ID",
          },
        });
        return;
      }

      // Mark as read
      await notificationService.markNotificationAsRead(
        notificationId,
        patient.id,
      );

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error: any) {
      logger.error("Error marking notification as read:", error);

      if (error.message === "NOTIFICATION_NOT_FOUND_OR_ALREADY_READ") {
        res.status(404).json({
          success: false,
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: "Notification not found or already read",
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to mark notification as read",
        },
      });
    }
  }

  /**
   * Get unread notification count
   * GET /api/patient/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Unauthorized. Please login.",
          },
        });
        return;
      }

      // Get patient profile
      const patient = await patientRepository.findPatientProfileByUserId(
        req.user.userId,
      );

      if (!patient) {
        res.status(404).json({
          success: false,
          error: {
            code: "PATIENT_NOT_FOUND",
            message: "Patient profile not found",
          },
        });
        return;
      }

      // Get unread count
      const unreadCount = await notificationService.getUnreadNotificationCount(
        patient.id,
      );

      res.status(200).json({
        success: true,
        data: {
          unread_count: unreadCount,
        },
      });
    } catch (error: any) {
      logger.error("Error getting unread notification count:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to get unread count",
        },
      });
    }
  }
}

export const patientNotificationController =
  new PatientNotificationController();
