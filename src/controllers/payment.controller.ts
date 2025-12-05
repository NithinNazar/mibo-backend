// src/controllers/payment.controller.ts
import { Response, NextFunction, Request } from "express";
import { paymentService } from "../services/payment.service";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  validateCreateOrder,
  validateVerifyPayment,
  validateCreateRefund,
  validateWebhookPayload,
} from "../validations/payment.validation";

export class PaymentController {
  /**
   * Create Razorpay order
   */
  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const dto = validateCreateOrder(req.body);

      // Get patient ID from authenticated user
      let patientId: number;
      if (req.user.userType === "PATIENT") {
        patientId = req.user.userId;
      } else {
        // Staff creating order for patient
        if (!req.body.patient_id) {
          return next(new Error("patient_id is required for staff users"));
        }
        patientId = Number(req.body.patient_id);
      }

      const order = await paymentService.createRazorpayOrder(
        dto.appointment_id,
        patientId
      );

      return created(res, order, "Payment order created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = validateVerifyPayment(req.body);

      const payment = await paymentService.verifyPayment(
        dto.razorpay_order_id,
        dto.razorpay_payment_id,
        dto.razorpay_signature
      );

      return ok(res, payment, "Payment verified successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_SIGNATURE",
            message: "Webhook signature is missing",
          },
        });
      }

      const payload = validateWebhookPayload(req.body);

      await paymentService.handleWebhook(payload, signature);

      return res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get payments by patient
   */
  async getPaymentsByPatient(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const patientId = Number(req.params.id);

      const payments = await paymentService.getPaymentsByPatient(patientId);

      return ok(res, payments);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const paymentId = Number(req.params.id);

      const payment = await paymentService.getPaymentById(paymentId);

      return ok(res, payment);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all payments with filters
   */
  async getPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters: any = {};

      if (req.query.status) {
        filters.status = String(req.query.status);
      }

      if (req.query.patientId) {
        filters.patientId = Number(req.query.patientId);
      }

      if (req.query.startDate) {
        filters.startDate = String(req.query.startDate);
      }

      if (req.query.endDate) {
        filters.endDate = String(req.query.endDate);
      }

      const payments = await paymentService.getPayments(filters);

      return ok(res, payments);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create refund
   */
  async createRefund(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = validateCreateRefund(req.body);

      const refund = await paymentService.createRefund(
        dto.payment_id,
        dto.amount,
        dto.reason
      );

      return created(res, refund, "Refund created successfully");
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
