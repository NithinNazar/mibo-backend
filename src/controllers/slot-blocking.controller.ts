// src/controllers/slot-blocking.controller.ts
import { Request, Response } from "express";
import { slotBlockingService } from "../services/slot-blocking.service";
import logger from "../config/logger";
import { BlockSlotRequest } from "../types/slot-blocking.types";

class SlotBlockingController {
  /**
   * Block a single slot
   * POST /api/admin/slots/block
   */
  async blockSlot(req: Request, res: Response): Promise<void> {
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

      const { clinician_id, centre_id, date, start_time, end_time, reason } =
        req.body;

      // Validate required fields
      if (!clinician_id || !centre_id || !date || !start_time || !end_time) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message:
              "Missing required fields: clinician_id, centre_id, date, start_time, end_time",
          },
        });
        return;
      }

      // Block the slot
      const result = await slotBlockingService.blockSlot(
        parseInt(clinician_id),
        parseInt(centre_id),
        date,
        start_time,
        end_time,
        req.user.userId,
        reason,
      );

      res.status(200).json({
        success: true,
        data: {
          blocked_slot: result.blockedSlot,
          affected_patients: result.affectedPatients,
        },
      });
    } catch (error: any) {
      logger.error("Error blocking slot:", error);

      if (error.message === "PAST_SLOT_BLOCKING") {
        res.status(400).json({
          success: false,
          error: {
            code: "PAST_SLOT_BLOCKING",
            message: "Cannot block slots in the past",
          },
        });
        return;
      }

      if (error.message === "SLOT_ALREADY_BLOCKED") {
        res.status(409).json({
          success: false,
          error: {
            code: "SLOT_ALREADY_BLOCKED",
            message: "Slot is already blocked",
          },
        });
        return;
      }

      if (error.message === "INVALID_TIME_RANGE") {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_TIME_RANGE",
            message: "Start time must be before end time",
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to block slot",
        },
      });
    }
  }

  /**
   * Block multiple slots
   * POST /api/admin/slots/block-multiple
   */
  async blockMultipleSlots(req: Request, res: Response): Promise<void> {
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

      const { slots, reason } = req.body;

      // Validate required fields
      if (!slots || !Array.isArray(slots) || slots.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Missing or invalid slots array",
          },
        });
        return;
      }

      // Block multiple slots
      const result = await slotBlockingService.blockMultipleSlots(
        slots as BlockSlotRequest[],
        req.user.userId,
        reason,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Error blocking multiple slots:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to block slots",
        },
      });
    }
  }

  /**
   * Block all slots for a clinician on a specific day
   * POST /api/admin/slots/block-day
   */
  async blockClinicianDay(req: Request, res: Response): Promise<void> {
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

      const { clinician_id, centre_id, date, reason } = req.body;

      // Validate required fields
      if (!clinician_id || !centre_id || !date) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Missing required fields: clinician_id, centre_id, date",
          },
        });
        return;
      }

      // Block clinician day
      const result = await slotBlockingService.blockClinicianDay(
        parseInt(clinician_id),
        parseInt(centre_id),
        date,
        req.user.userId,
        reason,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error("Error blocking clinician day:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to block clinician day",
        },
      });
    }
  }

  /**
   * Unblock a slot
   * POST /api/admin/slots/unblock/:slotId
   */
  async unblockSlot(req: Request, res: Response): Promise<void> {
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

      const slotId = parseInt(req.params.slotId);

      if (isNaN(slotId)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_SLOT_ID",
            message: "Invalid slot ID",
          },
        });
        return;
      }

      // Unblock the slot
      await slotBlockingService.unblockSlot(slotId, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Slot unblocked successfully",
      });
    } catch (error: any) {
      logger.error("Error unblocking slot:", error);

      if (error.message === "SLOT_NOT_FOUND") {
        res.status(404).json({
          success: false,
          error: {
            code: "SLOT_NOT_FOUND",
            message: "Slot not found",
          },
        });
        return;
      }

      if (error.message === "SLOT_NOT_BLOCKED") {
        res.status(409).json({
          success: false,
          error: {
            code: "SLOT_NOT_BLOCKED",
            message: "Slot is not currently blocked",
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to unblock slot",
        },
      });
    }
  }

  /**
   * Get blocked slots with filters
   * GET /api/admin/slots/blocked
   */
  async getBlockedSlots(req: Request, res: Response): Promise<void> {
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

      const {
        clinician_id,
        centre_id,
        date_from,
        date_to,
        is_blocked,
        blocked_by_admin_id,
      } = req.query;

      const filters: any = {};
      if (clinician_id) filters.clinician_id = parseInt(clinician_id as string);
      if (centre_id) filters.centre_id = parseInt(centre_id as string);
      if (date_from) filters.date_from = date_from as string;
      if (date_to) filters.date_to = date_to as string;
      if (is_blocked !== undefined) filters.is_blocked = is_blocked === "true";
      if (blocked_by_admin_id)
        filters.blocked_by_admin_id = parseInt(blocked_by_admin_id as string);

      const blockedSlots = await slotBlockingService.getBlockedSlots(filters);

      res.status(200).json({
        success: true,
        data: {
          blocked_slots: blockedSlots,
          total: blockedSlots.length,
        },
      });
    } catch (error: any) {
      logger.error("Error getting blocked slots:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to get blocked slots",
        },
      });
    }
  }

  /**
   * Get affected patients (preview before blocking)
   * POST /api/admin/slots/affected-patients
   */
  async getAffectedPatients(req: Request, res: Response): Promise<void> {
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

      const { slots } = req.body;

      // Validate required fields
      if (!slots || !Array.isArray(slots) || slots.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Missing or invalid slots array",
          },
        });
        return;
      }

      // Get affected patients
      const affectedPatients = await slotBlockingService.getAffectedPatients(
        slots as BlockSlotRequest[],
      );

      res.status(200).json({
        success: true,
        data: {
          affected_patients: affectedPatients,
          total_count: affectedPatients.length,
        },
      });
    } catch (error: any) {
      logger.error("Error getting affected patients:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: error.message || "Failed to get affected patients",
        },
      });
    }
  }
}

export const slotBlockingController = new SlotBlockingController();
