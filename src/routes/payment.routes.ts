// src/routes/payment.routes.ts
import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { paymentLinkController } from "../controllers/payment-link.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

/**
 * POST /api/payment/create-order
 * Create Razorpay order for appointment
 * Protected endpoint - requires authentication
 */
router.post(
  "/create-order",
  authMiddleware,
  paymentController.createOrder.bind(paymentController),
);

/**
 * POST /api/payment/verify
 * Verify payment signature and update appointment
 * Protected endpoint - requires authentication
 */
router.post(
  "/verify",
  authMiddleware,
  paymentController.verifyPayment.bind(paymentController),
);

/**
 * POST /api/payment/webhook
 * Handle Razorpay webhooks
 * Public endpoint - verified by signature
 */
router.post(
  "/webhook",
  paymentController.handleWebhook.bind(paymentController),
);

/**
 * GET /api/payment/:appointmentId
 * Get payment details for an appointment
 * Protected endpoint - requires authentication
 */
router.get(
  "/:appointmentId",
  authMiddleware,
  paymentController.getPaymentDetails.bind(paymentController),
);

/**
 * GET /api/payment/history
 * Get payment history for logged-in patient
 * Protected endpoint - requires authentication
 */
router.get(
  "/history",
  authMiddleware,
  paymentController.getPaymentHistory.bind(paymentController),
);

/**
 * POST /api/payment/send-link
 * Send payment link to patient via WhatsApp
 * Protected endpoint - requires authentication (FRONT_DESK, ADMIN, MANAGER)
 */
router.post(
  "/send-link",
  authMiddleware,
  paymentController.sendPaymentLink.bind(paymentController),
);

export default router;

/**
 * POST /api/payments/create-link
 * Create Razorpay payment link and send via WhatsApp (Gallabox)
 * For front desk booking - creates payment link and sends to customer
 * Protected endpoint - requires FRONT_DESK, ADMIN, or MANAGER role
 */
router.post(
  "/create-link",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "FRONT_DESK", "CARE_COORDINATOR"),
  (req, res, next) => paymentLinkController.createPaymentLink(req, res, next),
);

/**
 * GET /api/payments/verify/:paymentLinkId
 * Verify payment link status
 * Protected endpoint - requires authentication
 */
router.get("/verify/:paymentLinkId", authMiddleware, (req, res, next) =>
  paymentLinkController.verifyPayment(req, res, next),
);
