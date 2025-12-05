// src/controllers/video.controller.ts
import { Response, NextFunction } from "express";
import { videoService } from "../services/video.service";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ApiError } from "../utils/apiError";

export class VideoController {
  /**
   * Generate Meet link
   */
  async generateMeetLink(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const appointmentId = Number(req.body.appointment_id);

      if (!appointmentId) {
        throw ApiError.badRequest("appointment_id is required");
      }

      const meetLink = await videoService.generateGoogleMeetLink(appointmentId);

      return created(
        res,
        { appointment_id: appointmentId, meet_link: meetLink },
        "Meet link generated successfully"
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Meet link for appointment
   */
  async getMeetLinkForAppointment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const appointmentId = Number(req.params.id);

      const videoLink = await videoService.getMeetLinkForAppointment(
        appointmentId
      );

      return ok(res, videoLink);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Meet link
   */
  async updateMeetLink(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const appointmentId = Number(req.params.id);
      const meetLink = req.body.meet_link;

      if (!meetLink || typeof meetLink !== "string") {
        throw ApiError.badRequest("meet_link is required");
      }

      const updated = await videoService.updateMeetLink(
        appointmentId,
        meetLink
      );

      return ok(res, updated, "Meet link updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete Meet link
   */
  async deleteMeetLink(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const appointmentId = Number(req.params.id);

      await videoService.deleteMeetLink(appointmentId);

      return ok(res, null, "Meet link deleted successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all video links
   */
  async getAllVideoLinks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters: any = {};

      if (req.query.startDate) {
        filters.startDate = String(req.query.startDate);
      }

      if (req.query.endDate) {
        filters.endDate = String(req.query.endDate);
      }

      if (req.query.provider) {
        filters.provider = String(req.query.provider);
      }

      const videoLinks = await videoService.getAllVideoLinks(filters);

      return ok(res, videoLinks);
    } catch (err) {
      next(err);
    }
  }
}

export const videoController = new VideoController();
