// src/controllers/booking.controller.ts
import { Request, Response, NextFunction } from "express";
import { bookingService } from "../services/booking.service";
import { ok, created } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export class BookingController {
  /**
   * POST /api/booking/initiate
   * Initiate booking and send OTP
   * Body: { phone, clinician_id, centre_id, appointment_type, scheduled_start_at, duration_minutes? }
   */
  async initiateBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingService.initiateBooking(req.body);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/booking/confirm
   * Verify OTP, create appointment, generate payment
   * Body: { phone, otp, full_name, email?, clinician_id, centre_id, appointment_type, scheduled_start_at, duration_minutes? }
   */
  async confirmBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingService.confirmBooking(req.body);
      return created(res, result, "Booking confirmed successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/booking/payment-success
   * Handle payment success callback
   * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  async handlePaymentSuccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      const result = await bookingService.handlePaymentSuccess(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/booking/payment-failure
   * Handle payment failure callback
   * Body: { razorpay_order_id, reason? }
   */
  async handlePaymentFailure(req: Request, res: Response, next: NextFunction) {
    try {
      const { razorpay_order_id, reason } = req.body;

      const result = await bookingService.handlePaymentFailure(
        razorpay_order_id,
        reason
      );

      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/booking/status/:appointmentId
   * Get booking status
   * Protected endpoint - requires authentication
   */
  async getBookingStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const appointmentId = Number(req.params.appointmentId);

      // Get patient ID from authenticated user
      const { patientRepository } = await import(
        "../repositories/patient.repository"
      );
      const patient = await patientRepository.findByUserId(req.user.userId);

      if (!patient) {
        return next(new Error("Patient profile not found"));
      }

      const result = await bookingService.getBookingStatus(
        appointmentId,
        patient.profile.id
      );

      return ok(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const bookingController = new BookingController();
