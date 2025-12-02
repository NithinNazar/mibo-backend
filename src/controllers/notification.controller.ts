// src/controllers/notification.controller.ts
import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { ok } from "../utils/response";

export class NotificationController {
  async test(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, message } = req.body;
      const result = await notificationService.sendOtp(phone, message);
      return ok(res, result, "Sent");
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
