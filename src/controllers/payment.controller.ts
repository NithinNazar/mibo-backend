// src/controllers/payment.controller.ts
import { Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import logger from "../config/logger";

class PaymentController {
  /**
   * Create Razorpay order
   * POST /api/payment/create-order
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized. Please login.",
        });
        return;
      }

      const { appointmentId } = req.body;

      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: "Appointment ID is required",
        });
        return;
      }

      const result = await paymentService.createPaymentOrder(
        req.user.userId,
        parseInt(appointmentId)
      );

      res.json({
        success: true,
        message: "Payment order created successfully",
        data: result,
      });
    } catch (error: any) {
      logger.error("Error creating payment order:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create payment order",
      });
    }
  }

  /**
   * Verify payment
   * POST /api/payment/verify
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized. Please login.",
        });
        return;
      }

      const {
        appointmentId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      } = req.body;

      // Validate required fields
      if (
        !appointmentId ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature",
        });
        return;
      }

      const result = await paymentService.verifyPayment(req.user.userId, {
        appointmentId: parseInt(appointmentId),
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      res.json({
        success: true,
        message:
          "Payment verified successfully! Your appointment is confirmed.",
        data: result,
      });
    } catch (error: any) {
      logger.error("Error verifying payment:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Payment verification failed",
      });
    }
  }

  /**
   * Handle Razorpay webhook
   * POST /api/payment/webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;

      if (!signature) {
        res.status(400).json({
          success: false,
          message: "Missing webhook signature",
        });
        return;
      }

      await paymentService.handleWebhook(signature, req.body);

      res.json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (error: any) {
      logger.error("Error handling webhook:", error);
      res.status(500).json({
        success: false,
        message: "Webhook processing failed",
      });
    }
  }

  /**
   * Get payment details
   * GET /api/payment/:appointmentId
   */
  async getPaymentDetails(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized. Please login.",
        });
        return;
      }

      const appointmentId = parseInt(req.params.appointmentId);

      if (isNaN(appointmentId)) {
        res.status(400).json({
          success: false,
          message: "Invalid appointment ID",
        });
        return;
      }

      const payment = await paymentService.getPaymentDetails(
        req.user.userId,
        appointmentId
      );

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      logger.error("Error getting payment details:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Payment not found",
      });
    }
  }

  /**
   * Get payment history
   * GET /api/payment/history
   */
  async getPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized. Please login.",
        });
        return;
      }

      const { status, limit, offset } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const payments = await paymentService.getPaymentHistory(
        req.user.userId,
        filters
      );

      res.json({
        success: true,
        data: {
          payments,
          total: payments.length,
        },
      });
    } catch (error: any) {
      logger.error("Error getting payment history:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get payment history",
      });
    }
  }
}

export const paymentController = new PaymentController();
