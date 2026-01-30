// src/controllers/payment-link.controller.ts
import { Request, Response, NextFunction } from "express";
import { paymentLinkService } from "../services/payment-link.service";
import { ok, created } from "../utils/response";
import { ApiError } from "../utils/apiError";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PaymentLinkController {
  /**
   * POST /api/payments/create-link
   * Create payment link and send via WhatsApp
   */
  async createPaymentLink(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        clinicianId,
        amount,
        customerName,
        customerPhone,
        customerEmail,
        appointmentId,
        description,
      } = req.body;

      // Validation
      if (!clinicianId || !amount || !customerName || !customerPhone) {
        throw ApiError.badRequest(
          "Missing required fields: clinicianId, amount, customerName, customerPhone",
        );
      }

      if (amount <= 0) {
        throw ApiError.badRequest("Amount must be greater than 0");
      }

      // Create and send payment link
      const result = await paymentLinkService.createAndSendPaymentLink({
        clinicianId,
        amount,
        customerName,
        customerPhone,
        customerEmail,
        appointmentId,
        description,
      });

      return created(res, result, "Payment link created and sent successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/payments/verify/:paymentLinkId
   * Verify payment status
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentLinkId } = req.params;

      if (!paymentLinkId) {
        throw ApiError.badRequest("Payment link ID is required");
      }

      const result = await paymentLinkService.verifyPayment(paymentLinkId);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const paymentLinkController = new PaymentLinkController();
