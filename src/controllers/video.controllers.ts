// src/controllers/video.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { videoService } from "../services/video.service";
import { ok, created } from "../utils/response";

export class VideoController {
  /*
   POST /api/video/appointments/:appointmentId/meet
   Ensures meet link exists, creates if not.
  */
  async ensureMeet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const appointmentId = Number(req.params.appointmentId);
      const session = await videoService.ensureMeetForAppointment(
        appointmentId,
        req.user
      );

      return created(res, session, "Meet session ready");
    } catch (err) {
      next(err);
    }
  }

  /*
   GET /api/video/appointments/:appointmentId
   Returns meet session details for this appointment.
  */
  async getSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const appointmentId = Number(req.params.appointmentId);
      const session = await videoService.getSessionForAppointment(
        appointmentId,
        req.user
      );

      return ok(res, session);
    } catch (err) {
      next(err);
    }
  }
}

export const videoController = new VideoController();
