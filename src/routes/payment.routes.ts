// src/routes/payment.routes.ts
import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/*
 Create Razorpay order and payment record.
 Patients and staff can call this.
*/
router.post("/create-intent", authenticate, (req, res, next) =>
  paymentController.createIntent(req, res, next)
);

/*
 Verify payment after successful Razorpay checkout.
*/
router.post("/verify", authenticate, (req, res, next) =>
  paymentController.verify(req, res, next)
);

/*
 Webhook endpoint for Razorpay.
 You should configure this URL in Razorpay dashboard.
*/
router.post("/webhook", (req, res, next) =>
  paymentController.webhook(req, res, next)
);

export default router;
