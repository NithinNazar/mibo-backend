// src/services/booking.service.ts
import { patientAuthService } from "./patient-auth.service";
import { appointmentService } from "./appointment.services";
import { paymentService } from "./payment.service";
import { patientRepository } from "../repositories/patient.repository";
import { appointmentRepository } from "../repositories/appointment.repository";
import { ApiError } from "../utils/apiError";
import logger from "../config/logger";
import { db } from "../config/db";

interface BookingInitiateData {
  phone: string;
  clinician_id: number;
  centre_id: number;
  appointment_type: "IN_PERSON" | "ONLINE";
  scheduled_start_at: string;
  duration_minutes?: number;
}

interface BookingConfirmData {
  phone: string;
  otp: string;
  full_name: string;
  email?: string;
  clinician_id: number;
  centre_id: number;
  appointment_type: "IN_PERSON" | "ONLINE";
  scheduled_start_at: string;
  duration_minutes?: number;
}

export class BookingService {
  /**
   * Step 1: Initiate booking and send OTP
   * User selects expert, mode, date, time
   * System sends OTP to phone via WhatsApp
   */
  async initiateBooking(data: BookingInitiateData) {
    // Validate clinician exists and is available
    const clinician = await this.validateClinician(data.clinician_id);

    // Validate centre exists
    const centre = await this.validateCentre(data.centre_id);

    // Check availability
    const dateStr = new Date(data.scheduled_start_at)
      .toISOString()
      .split("T")[0];
    const slots = await appointmentService.checkClinicianAvailability(
      data.clinician_id,
      data.centre_id,
      dateStr
    );

    const requestedTime = new Date(data.scheduled_start_at)
      .toTimeString()
      .substring(0, 5);
    const isAvailable = slots.some(
      (slot) => slot.startTime === requestedTime && slot.available
    );

    if (!isAvailable) {
      throw ApiError.badRequest(
        "Selected time slot is not available. Please choose another time."
      );
    }

    // Send OTP to patient's phone
    const otpResult = await patientAuthService.sendOtp(data.phone);

    // Store booking intent in session/cache (optional - for now we'll rely on frontend state)
    logger.info(`Booking initiated for phone ${data.phone}`);

    return {
      message: "OTP sent successfully. Please verify to continue booking.",
      isNewUser: otpResult.isNewUser,
      clinician: {
        id: clinician.id,
        name: clinician.full_name,
        specialization: clinician.specialization,
        consultation_fee: clinician.consultation_fee,
      },
      centre: {
        id: centre.id,
        name: centre.name,
        address: centre.address,
      },
      appointment: {
        type: data.appointment_type,
        scheduled_at: data.scheduled_start_at,
        duration_minutes: data.duration_minutes || 30,
      },
    };
  }

  /**
   * Step 2: Verify OTP, collect patient details, create appointment, generate payment
   * User enters OTP, name, email
   * System creates/authenticates patient, creates appointment, generates payment order
   */
  async confirmBooking(data: BookingConfirmData) {
    // Verify OTP and authenticate/create patient
    const authResult = await patientAuthService.verifyOtpAndAuthenticate(
      data.phone,
      data.otp,
      data.full_name,
      data.email
    );

    logger.info(`Patient authenticated: ${authResult.user.id}`);

    // Create appointment
    const appointment = await appointmentService.createAppointment(
      {
        clinician_id: data.clinician_id,
        centre_id: data.centre_id,
        appointment_type: data.appointment_type,
        scheduled_start_at: data.scheduled_start_at,
        duration_minutes: data.duration_minutes || 30,
      },
      {
        userId: authResult.user.id,
        userType: "PATIENT",
        roles: [],
      }
    );

    logger.info(`Appointment created: ${appointment.id}`);

    // Get clinician details for consultation fee
    const clinician = await this.getClinicianDetails(data.clinician_id);
    const centre = await this.validateCentre(data.centre_id);

    // Create payment order
    const paymentOrder = await paymentService.createRazorpayOrder(
      appointment.id,
      authResult.patient.id
    );

    logger.info(`Payment order created: ${paymentOrder.orderId}`);

    return {
      message: "Booking confirmed. Please proceed with payment.",
      auth: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
      },
      patient: {
        id: authResult.patient.id,
        name: authResult.user.full_name,
        phone: authResult.user.phone,
        email: authResult.user.email,
      },
      appointment: {
        id: appointment.id,
        clinician_name: clinician.full_name,
        centre_name: centre.name,
        type: appointment.appointment_type,
        scheduled_at: appointment.scheduled_start_at,
        status: appointment.status,
      },
      payment: {
        orderId: paymentOrder.orderId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        consultation_fee: clinician.consultation_fee,
      },
    };
  }

  /**
   * Step 3: Handle payment success
   * Called after successful payment
   * Updates appointment status and redirects to patient dashboard
   */
  async handlePaymentSuccess(
    orderId: string,
    paymentId: string,
    signature: string
  ) {
    // Verify payment
    const payment = await paymentService.verifyPayment(
      orderId,
      paymentId,
      signature
    );

    logger.info(`Payment verified: ${payment.id}`);

    // Get appointment details
    const appointment = await appointmentRepository.getAppointmentById(
      payment.appointment_id
    );

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    // Get clinician and centre names
    const clinician = await this.getClinicianDetails(appointment.clinician_id);
    const centre = await this.validateCentre(appointment.centre_id);

    return {
      success: true,
      message: "Payment successful! Your appointment is confirmed.",
      appointment: {
        id: appointment.id,
        clinician_name: clinician.full_name,
        centre_name: centre.name,
        type: appointment.appointment_type,
        scheduled_at: appointment.scheduled_start_at,
        status: appointment.status,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        paid_at: payment.paid_at,
      },
      redirectTo: "/patient/dashboard",
    };
  }

  /**
   * Step 4: Handle payment failure
   * Called after failed payment
   * Shows failure notification and redirects to expert page
   */
  async handlePaymentFailure(orderId: string, reason?: string) {
    await paymentService.handlePaymentFailure(
      orderId,
      reason || "Payment failed"
    );

    logger.warn(`Payment failed for order: ${orderId}`);

    return {
      success: false,
      message: "Payment failed. Please try again.",
      reason: reason || "Payment was not completed",
      redirectTo: "/experts",
    };
  }

  /**
   * Get booking status
   */
  async getBookingStatus(appointmentId: number, patientId: number) {
    const appointment = await appointmentRepository.getAppointmentById(
      appointmentId
    );

    if (!appointment) {
      throw ApiError.notFound("Appointment not found");
    }

    // Verify patient owns the appointment
    if (appointment.patient_id !== patientId) {
      throw ApiError.forbidden("You do not have access to this appointment");
    }

    // Get clinician and centre names
    const clinician = await this.getClinicianDetails(appointment.clinician_id);
    const centre = await this.validateCentre(appointment.centre_id);

    // Get payment status
    const { paymentRepository } = await import(
      "../repositories/payment.repository"
    );
    const payment = await paymentRepository.findPaymentByAppointment(
      appointmentId
    );

    return {
      appointment: {
        id: appointment.id,
        clinician_name: clinician.full_name,
        centre_name: centre.name,
        type: appointment.appointment_type,
        scheduled_at: appointment.scheduled_start_at,
        status: appointment.status,
      },
      payment: payment
        ? {
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            paid_at: payment.paid_at,
          }
        : null,
    };
  }

  /**
   * Validate clinician exists and is active
   */
  private async validateClinician(clinicianId: number) {
    const clinician = await db.oneOrNone(
      `
      SELECT cp.id, u.full_name, cp.specialization, cp.consultation_fee
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = $1 AND cp.is_active = TRUE AND u.is_active = TRUE
      `,
      [clinicianId]
    );

    if (!clinician) {
      throw ApiError.notFound("Clinician not found or inactive");
    }

    return clinician;
  }

  /**
   * Validate centre exists and is active
   */
  private async validateCentre(centreId: number) {
    const centre = await db.oneOrNone(
      `
      SELECT id, name, address
      FROM centres
      WHERE id = $1 AND is_active = TRUE
      `,
      [centreId]
    );

    if (!centre) {
      throw ApiError.notFound("Centre not found or inactive");
    }

    return centre;
  }

  /**
   * Get clinician details including consultation fee
   */
  private async getClinicianDetails(clinicianId: number) {
    const clinician = await db.oneOrNone(
      `
      SELECT cp.id, u.full_name, cp.specialization, cp.consultation_fee
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = $1
      `,
      [clinicianId]
    );

    if (!clinician) {
      throw ApiError.notFound("Clinician not found");
    }

    return clinician;
  }
}

export const bookingService = new BookingService();
