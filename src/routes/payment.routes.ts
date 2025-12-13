// src/routes/payment.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

/**
 * POST /api/payments/create-order
 * Create Razorpay payment order
 * Authentication: Required
 * For patients: patient_id is derived from auth
 * For staff: patient_id must be provided in body
 */
router.post("/create-order", authenticate, (req, res, next) =>
  paymentController.createOrder(req, res, next)
);

/**
 * POST /api/payments/verify
 * Verify payment after Razorpay checkout
 * Authentication: Required
 */
router.post("/verify", authenticate, (req, res, next) =>
  paymentController.verifyPayment(req, res, next)
);

/**
 * POST /api/payments/webhook
 * Razorpay webhook endpoint
 * No authentication - signature verified in controller
 */
router.post("/webhook", (req, res, next) =>
  paymentController.handleWebhook(req, res, next)
);

/**
 * GET /api/payments
 * Get all payments with filters
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER
 * Query params: status, patientId, startDate, endDate
 */
router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  (req, res, next) => paymentController.getPayments(req, res, next)
);

/**
 * GET /api/payments/:id
 * Get payment by ID
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.get(
  "/:id",
  authenticate,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => paymentController.getPaymentById(req, res, next)
);

/**
 * GET /api/payments/patient/:id
 * Get payments by patient ID
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.get(
  "/patient/:id",
  authenticate,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => paymentController.getPaymentsByPatient(req, res, next)
);

/**
 * POST /api/payments/refund
 * Create refund for a payment
 * Roles: ADMIN, MANAGER
 */
router.post(
  "/refund",
  authenticate,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) => paymentController.createRefund(req, res, next)
);

/**
 * POST /api/payments/send-payment-link
 * Create and send payment link to patient via WhatsApp
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.post(
  "/send-payment-link",
  authenticate,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => paymentController.sendPaymentLink(req, res, next)
);

/**
 * GET /api/payments/link-status/:linkId
 * Get payment link status
 * Roles: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK
 */
router.get(
  "/link-status/:linkId",
  authenticate,
  requireRole(
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK"
  ),
  (req, res, next) => paymentController.getPaymentLinkStatus(req, res, next)
);

export default router;
