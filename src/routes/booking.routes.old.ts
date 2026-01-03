// src/routes/booking.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import { bookingController } from "../controllers/booking.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { body } from "express-validator";
import { validate } from "../middlewares/validation.middleware";

const router = Router();

/**
 * POST /api/booking/initiate
 * Initiate booking and send OTP
 * Public endpoint
 */
router.post(
  "/initiate",
  [
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[+]?[0-9]{10,15}$/)
      .withMessage("Invalid phone number format"),
    body("clinician_id")
      .notEmpty()
      .withMessage("Clinician ID is required")
      .isInt({ min: 1 })
      .withMessage("Invalid clinician ID"),
    body("centre_id")
      .notEmpty()
      .withMessage("Centre ID is required")
      .isInt({ min: 1 })
      .withMessage("Invalid centre ID"),
    body("appointment_type")
      .notEmpty()
      .withMessage("Appointment type is required")
      .isIn(["IN_PERSON", "ONLINE"])
      .withMessage("Appointment type must be IN_PERSON or ONLINE"),
    body("scheduled_start_at")
      .notEmpty()
      .withMessage("Scheduled start time is required")
      .isISO8601()
      .withMessage("Invalid date format"),
    body("duration_minutes")
      .optional()
      .isInt({ min: 15, max: 180 })
      .withMessage("Duration must be between 15 and 180 minutes"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    bookingController.initiateBooking(req, res, next)
);

/**
 * POST /api/booking/confirm
 * Verify OTP and confirm booking
 * Public endpoint
 */
router.post(
  "/confirm",
  [
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[+]?[0-9]{10,15}$/)
      .withMessage("Invalid phone number format"),
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must be numeric"),
    body("full_name")
      .notEmpty()
      .withMessage("Full name is required")
      .isString()
      .withMessage("Full name must be a string")
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("clinician_id")
      .notEmpty()
      .withMessage("Clinician ID is required")
      .isInt({ min: 1 })
      .withMessage("Invalid clinician ID"),
    body("centre_id")
      .notEmpty()
      .withMessage("Centre ID is required")
      .isInt({ min: 1 })
      .withMessage("Invalid centre ID"),
    body("appointment_type")
      .notEmpty()
      .withMessage("Appointment type is required")
      .isIn(["IN_PERSON", "ONLINE"])
      .withMessage("Appointment type must be IN_PERSON or ONLINE"),
    body("scheduled_start_at")
      .notEmpty()
      .withMessage("Scheduled start time is required")
      .isISO8601()
      .withMessage("Invalid date format"),
    body("duration_minutes")
      .optional()
      .isInt({ min: 15, max: 180 })
      .withMessage("Duration must be between 15 and 180 minutes"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    bookingController.confirmBooking(req, res, next)
);

/**
 * POST /api/booking/payment-success
 * Handle payment success
 * Public endpoint (called by Razorpay)
 */
router.post(
  "/payment-success",
  [
    body("razorpay_order_id")
      .notEmpty()
      .withMessage("Razorpay order ID is required"),
    body("razorpay_payment_id")
      .notEmpty()
      .withMessage("Razorpay payment ID is required"),
    body("razorpay_signature")
      .notEmpty()
      .withMessage("Razorpay signature is required"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    bookingController.handlePaymentSuccess(req, res, next)
);

/**
 * POST /api/booking/payment-failure
 * Handle payment failure
 * Public endpoint (called by Razorpay)
 */
router.post(
  "/payment-failure",
  [
    body("razorpay_order_id")
      .notEmpty()
      .withMessage("Razorpay order ID is required"),
    body("reason").optional().isString().withMessage("Reason must be a string"),
    validate,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    bookingController.handlePaymentFailure(req, res, next)
);

/**
 * GET /api/booking/status/:appointmentId
 * Get booking status
 * Protected endpoint
 */
router.get("/status/:appointmentId", authenticate, (req, res, next) =>
  bookingController.getBookingStatus(req, res, next)
);

export default router;
