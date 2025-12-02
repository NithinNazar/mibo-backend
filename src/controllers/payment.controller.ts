// src/controllers/payment.controller.ts
import { Response, NextFunction, Request } from "express";
import { paymentService } from "../services/payment.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ok, created } from "../utils/response";

export class PaymentController {
  /*
   POST /api/payments/create-intent
   Body: { appointment_id, amount, currency? }
  */
  async createIntent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const result = await paymentService.createPaymentIntent(
        req.body,
        req.user
      );
      return created(res, result, "Payment intent created");
    } catch (err) {
      next(err);
    }
  }

  /*
   POST /api/payments/verify
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  */
  async verify(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;
      const result = await paymentService.verifyAndCapture(req.body, req.user);
      return ok(res, result, "Payment verified");
    } catch (err) {
      next(err);
    }
  }

  /*
   POST /api/payments/webhook
   Must be called by Razorpay webhook with raw JSON.
   You may want to secure it further with signature header verification.
  */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.handleWebhook(req.body);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
