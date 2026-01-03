// src/routes/payment.routes.ts
import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * POST /api/payment/create-order
 * Create Razorpay order for appointment
 * Protected endpoint - requires authentication
 */
router.post(
  "/create-order",
  authMiddleware,
  paymentController.createOrder.bind(paymentController)
);

/**
 * POST /api/payment/verify
 * Verify payment signature and update appointment
 * Protected endpoint - requires authentication
 */
router.post(
  "/verify",
  authMiddleware,
  paymentController.verifyPayment.bind(paymentController)
);

/**
 * POST /api/payment/webhook
 * Handle Razorpay webhooks
 * Public endpoint - verified by signature
 */
router.post(
  "/webhook",
  paymentController.handleWebhook.bind(paymentController)
);

/**
 * GET /api/payment/:appointmentId
 * Get payment details for an appointment
 * Protected endpoint - requires authentication
 */
router.get(
  "/:appointmentId",
  authMiddleware,
  paymentController.getPaymentDetails.bind(paymentController)
);

/**
 * GET /api/payment/history
 * Get payment history for logged-in patient
 * Protected endpoint - requires authentication
 */
router.get(
  "/history",
  authMiddleware,
  paymentController.getPaymentHistory.bind(paymentController)
);

export default router;
