// src/services/payment.service.ts
import { paymentRepository } from "../repositories/payment.repository";
import { bookingRepository } from "../repositories/booking.repository";
import { appointmentRepository } from "../repositories/appointment.repository";
import { patientRepository } from "../repositories/patient.repository";
import { razorpayUtil } from "../utils/razorpay";
import { gallaboxUtil } from "../utils/gallabox";
import { googleMeetUtil } from "../utils/googleMeet";
import logger from "../config/logger";
import { db } from "../config/db";

class PaymentService {
  /**
   * Create Razorpay order for appointment
   */
  async createPaymentOrder(
    userId: number,
    appointmentId: number,
  ): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
    appointment: any;
    registrationFee: number;
    consultationFee: number;
  }> {
    try {
      // Get patient profile
      const patient =
        await patientRepository.findPatientProfileByUserId(userId);
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Get appointment details
      const appointment = await bookingRepository.findAppointmentByIdAndPatient(
        appointmentId,
        patient.id,
      );

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Check if appointment is already paid
      const existingPayment =
        await paymentRepository.findPaymentByAppointmentId(appointmentId);

      if (existingPayment && existingPayment.status === "SUCCESS") {
        throw new Error("Appointment is already paid");
      }

      // Get consultation fee (in rupees)
      const consultationFee = appointment.consultation_fee || 500;

      // Check if patient has paid registration fee
      const hasPatientPaidRegistrationFee =
        await patientRepository.hasPatientPaidRegistrationFee(userId);

      // Add registration fee (₹100) for new patients
      const registrationFee = hasPatientPaidRegistrationFee ? 0 : 100;
      const totalAmount = consultationFee + registrationFee;
      const amountInPaise = totalAmount * 100; // Convert to paise

      logger.info(
        `💰 Payment calculation for appointment ${appointmentId}: Consultation Fee: ₹${consultationFee}, Registration Fee: ₹${registrationFee}, Total: ₹${totalAmount}`,
      );

      // Create Razorpay order
      const razorpayOrder = await razorpayUtil.createOrder(
        amountInPaise,
        "INR",
        `appointment_${appointmentId}`,
        {
          appointmentId: appointmentId.toString(),
          patientId: patient.id.toString(),
          clinicianName: appointment.clinician_name,
          consultationFee: consultationFee.toString(),
          registrationFee: registrationFee.toString(),
        },
      );

      // Store payment record in database with separate consultation and registration fees
      await paymentRepository.createPayment({
        patientId: patient.id,
        appointmentId: appointmentId,
        orderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR",
        consultationFee: consultationFee,
        registrationFee: registrationFee,
      });

      logger.info(
        `✅ Payment order created: ${razorpayOrder.id} for appointment ${appointmentId}`,
      );

      return {
        orderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
        appointment: {
          id: appointment.id,
          clinicianName: appointment.clinician_name,
          specialization: appointment.specialization,
          scheduledStartAt: appointment.scheduled_start_at,
          appointmentType: appointment.appointment_type,
        },
        registrationFee: registrationFee,
        consultationFee: consultationFee,
      };
    } catch (error: any) {
      logger.error("Error creating payment order:", error);
      throw error;
    }
  }

  /**
   * Verify payment and update appointment status
   */
  async verifyPayment(
    userId: number,
    data: {
      appointmentId: number;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ): Promise<{
    success: boolean;
    appointment: any;
    payment: any;
  }> {
    try {
      // Get patient profile
      const patient =
        await patientRepository.findPatientProfileByUserId(userId);
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Verify appointment belongs to patient
      const appointment = await bookingRepository.findAppointmentByIdAndPatient(
        data.appointmentId,
        patient.id,
      );

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Verify payment signature
      const isValidSignature = razorpayUtil.verifyPaymentSignature(
        data.razorpayOrderId,
        data.razorpayPaymentId,
        data.razorpaySignature,
      );

      if (!isValidSignature) {
        // Update payment as failed
        await paymentRepository.updatePaymentFailed(
          data.razorpayOrderId,
          "SIGNATURE_VERIFICATION_FAILED",
          "Payment signature verification failed",
        );

        throw new Error("Payment verification failed. Invalid signature.");
      }

      // Fetch payment details from Razorpay
      const razorpayPayment = await razorpayUtil.fetchPayment(
        data.razorpayPaymentId,
      );

      // Update payment status to success
      const payment = await paymentRepository.updatePaymentSuccess(
        data.razorpayOrderId,
        data.razorpayPaymentId,
        {
          method: razorpayPayment.method,
          card_id: razorpayPayment.card_id,
          bank: razorpayPayment.bank,
          wallet: razorpayPayment.wallet,
          vpa: razorpayPayment.vpa,
        },
      );

      // Mark patient as having paid registration fee if this payment included it
      if (payment.registration_fee && payment.registration_fee > 0) {
        await patientRepository.markRegistrationFeePaid(userId);
        logger.info(`✅ Registration fee marked as paid for user ${userId}`);
      }

      // Update appointment status to CONFIRMED and activate the appointment
      await bookingRepository.updateAppointmentStatus(
        data.appointmentId,
        "CONFIRMED",
      );

      logger.info(
        `✅ Payment verified: ${data.razorpayPaymentId} for appointment ${data.appointmentId}`,
      );

      // Send WhatsApp confirmation
      await this.sendPaymentConfirmation(appointment, payment, patient);

      // Get updated appointment details
      const updatedAppointment = await bookingRepository.findAppointmentById(
        data.appointmentId,
      );

      return {
        success: true,
        appointment: {
          id: updatedAppointment.id,
          status: updatedAppointment.status,
          scheduledStartAt: updatedAppointment.scheduled_start_at,
          clinicianName: updatedAppointment.clinician_name,
          centreName: updatedAppointment.centre_name,
        },
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          paidAt: payment.paid_at,
        },
      };
    } catch (error: any) {
      logger.error("Error verifying payment:", error);
      throw error;
    }
  }

  /**
   * Send payment confirmation via WhatsApp
   * For online appointments, creates Google Meet link and sends it
   */
  private async sendPaymentConfirmation(
    appointment: any,
    payment: any,
    patient: any,
  ): Promise<void> {
    try {
      // Get user details
      const user = await patientRepository.findUserById(patient.user_id);
      if (!user || !user.phone) {
        logger.warn("Cannot send WhatsApp confirmation: No phone number");
        return;
      }

      // Format date and time
      const appointmentDate = new Date(appointment.scheduled_start_at);
      //TODO REMOVE IT LATER
      console.log("DB value:", appointment.scheduled_start_at);
      console.log("Parsed date:", new Date(appointment.scheduled_start_at));
      console.log(new Date("2026-03-12T04:30:00.000Z").toString());
      console.log(
        new Date("2026-03-12T04:30:00.000Z").toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      );
      const userTimezone = "Asia/Kolkata";
      const dateStr = appointmentDate.toLocaleDateString("en-IN", {
        timeZone: userTimezone,
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = appointmentDate.toLocaleTimeString("en-IN", {
        timeZone: userTimezone,
        hour: "2-digit",
        minute: "2-digit",
      });

      // Check if appointment is ONLINE type
      const isOnlineAppointment = appointment.appointment_type === "ONLINE";

      if (isOnlineAppointment) {
        // Create Google Meet link for online appointments
        try {
          logger.info(
            `📹 Creating Google Meet link for online appointment ${appointment.id}`,
          );

          // Extract date and time for Google Meet
          const appointmentDateOnly = appointmentDate
            .toISOString()
            .split("T")[0]; // YYYY-MM-DD
          const appointmentTimeOnly = appointmentDate
            .toTimeString()
            .substring(0, 5); // HH:MM

          // const meetingDetails = await googleMeetUtil.createMeetingLink({
          //   patientName: user.full_name,
          //   clinicianName: appointment.clinician_name,
          //   appointmentDate: appointmentDateOnly,
          //   appointmentTime: appointmentTimeOnly,
          //   durationMinutes: 50,
          // });

          const meetingDetails =
            await googleMeetUtil.createMeetLinkForAppointmentFromFrontend(
              user.full_name,
              appointment.clinician_name,
              user.email || "",
              new Date(appointment.scheduled_start_at).toISOString(),
              new Date(appointment.scheduled_end_at).toISOString(),
            );

          // Store Google Meet link in database
          await bookingRepository.updateAppointmentGoogleMeet(
            appointment.id,
            meetingDetails.meetLink,
            meetingDetails.eventId,
          );

          logger.info(
            `✅ Google Meet link created: ${meetingDetails.meetLink}`,
          );

          // Send online consultation confirmation with Google Meet link
          if (gallaboxUtil.isReady()) {
            await gallaboxUtil.sendOnlineConsultationConfirmation(
              user.phone,
              user.full_name,
              appointment.clinician_name,
              dateStr,
              timeStr,
              meetingDetails.meetLink,
            );

            logger.info(
              `✅ WhatsApp online consultation confirmation sent to ${user.phone} with Google Meet link`,
            );
          }
        } catch (meetError: any) {
          logger.error("Error creating Google Meet link:", meetError);
          // Fallback to regular confirmation without Meet link
          if (gallaboxUtil.isReady()) {
            await gallaboxUtil.sendAppointmentConfirmation(
              user.phone,
              user.full_name,
              appointment.clinician_name,
              dateStr,
              timeStr,
              appointment.centre_name,
            );
          }
        }
      } else {
        // Send regular confirmation for in-person appointments
        if (gallaboxUtil.isReady()) {
          await gallaboxUtil.sendAppointmentConfirmation(
            user.phone,
            user.full_name,
            appointment.clinician_name,
            dateStr,
            timeStr,
            appointment.centre_name,
          );

          logger.info(
            `✅ WhatsApp confirmation sent to ${user.phone} for appointment ${appointment.id}`,
          );
        }
      }
    } catch (error: any) {
      logger.error("Error sending WhatsApp confirmation:", error);
      // Don't throw error - payment is already successful
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleWebhook(signature: string, payload: any): Promise<void> {
    try {
      // Store webhook event
      const webhookEvent = await paymentRepository.storeWebhookEvent({
        provider: "RAZORPAY",
        providerEventId: payload.event,
        eventType: payload.event,
        rawPayload: payload,
      });

      // Verify webhook signature
      const isValid = razorpayUtil.verifyWebhookSignature(
        JSON.stringify(payload),
        signature,
      );

      if (!isValid) {
        logger.warn("Invalid webhook signature");
        return;
      }

      // Process webhook based on event type
      const event = payload.event;
      const paymentEntity = payload.payload?.payment?.entity;

      if (event === "payment.captured" && paymentEntity) {
        // Payment successful
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;

        // Update payment status
        await paymentRepository.updatePaymentSuccess(orderId, paymentId, {
          method: paymentEntity.method,
          amount: paymentEntity.amount,
        });

        // Get payment details
        const payment = await paymentRepository.findPaymentByOrderId(orderId);

        if (payment) {
          // Mark patient as having paid registration fee if this payment included it
          if (payment.registration_fee && payment.registration_fee > 0) {
            // Get patient user_id from appointment
            const appointment = await bookingRepository.findAppointmentById(
              payment.appointment_id,
            );
            if (appointment) {
              const patientProfile =
                await patientRepository.findPatientProfileByPatientId(
                  appointment.patient_id,
                );
              if (patientProfile) {
                await patientRepository.markRegistrationFeePaid(
                  patientProfile.user_id,
                );
                logger.info(
                  `✅ Registration fee marked as paid via webhook for user ${patientProfile.user_id}`,
                );
              }
            }
          }

          // Update appointment status
          await bookingRepository.updateAppointmentStatus(
            payment.appointment_id,
            "CONFIRMED",
          );

          logger.info(
            `✅ Webhook processed: Payment ${paymentId} captured for appointment ${payment.appointment_id}`,
          );
        }
      } else if (event === "payment.failed" && paymentEntity) {
        // Payment failed
        const orderId = paymentEntity.order_id;

        await paymentRepository.updatePaymentFailed(
          orderId,
          paymentEntity.error_code,
          paymentEntity.error_description,
        );

        // Get payment details to find associated appointment
        const payment = await paymentRepository.findPaymentByOrderId(orderId);

        if (payment) {
          // Cancel the appointment to free up the slot
          // Only cancel if appointment is still in BOOKED status (not already CONFIRMED or CANCELLED)
          await bookingRepository.updateAppointmentStatusConditional(
            payment.appointment_id,
            "CANCELLED",
            ["BOOKED"], // Only cancel if currently BOOKED
          );

          logger.info(
            `⚠️ Webhook processed: Payment failed for order ${orderId}, appointment ${payment.appointment_id} cancelled`,
          );
        } else {
          logger.info(
            `⚠️ Webhook processed: Payment failed for order ${orderId}`,
          );
        }
      }

      // Mark webhook as processed
      await paymentRepository.markWebhookProcessed(webhookEvent.id);
    } catch (error: any) {
      logger.error("Error handling webhook:", error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(userId: number, appointmentId: number): Promise<any> {
    try {
      // Get patient profile
      const patient =
        await patientRepository.findPatientProfileByUserId(userId);
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Get payment
      const payment =
        await paymentRepository.findPaymentByAppointmentId(appointmentId);

      if (!payment) {
        throw new Error("Payment not found");
      }

      // Verify payment belongs to patient
      if (payment.patient_id !== patient.id) {
        throw new Error("Unauthorized");
      }

      return {
        id: payment.id,
        orderId: payment.order_id,
        paymentId: payment.payment_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paid_at,
        createdAt: payment.created_at,
      };
    } catch (error: any) {
      logger.error("Error getting payment details:", error);
      throw error;
    }
  }

  /**
   * Get patient payment history
   */
  async getPaymentHistory(
    userId: number,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<any[]> {
    try {
      // Get patient profile
      const patient =
        await patientRepository.findPatientProfileByUserId(userId);
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Get payments
      const payments = await paymentRepository.getPatientPayments(
        patient.id,
        filters,
      );

      return payments.map((payment: any) => ({
        id: payment.id,
        orderId: payment.order_id,
        paymentId: payment.payment_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paid_at,
        appointmentDate: payment.scheduled_start_at,
        appointmentType: payment.appointment_type,
        createdAt: payment.created_at,
      }));
    } catch (error: any) {
      logger.error("Error getting payment history:", error);
      throw error;
    }
  }

  /**
   * Get registration fee status for a user
   */
  async getRegistrationFeeStatus(userId: number): Promise<{
    hasPaidRegistrationFee: boolean;
    registrationFee: number;
  }> {
    try {
      const hasPaid =
        await patientRepository.hasPatientPaidRegistrationFee(userId);

      return {
        hasPaidRegistrationFee: hasPaid,
        registrationFee: hasPaid ? 0 : 100,
      };
    } catch (error: any) {
      logger.error("Error getting registration fee status:", error);
      throw error;
    }
  }

  /**
   * Send payment link to patient via WhatsApp
   * Used by front desk staff to send payment links after booking
   */
  async sendPaymentLink(
    appointmentId: number,
    patientPhone: string,
    patientName: string,
  ): Promise<{
    paymentLink: string;
    whatsappSent: boolean;
    amount: number;
    expiresAt: Date;
  }> {
    try {
      // Get appointment details
      const appointment =
        await bookingRepository.findAppointmentById(appointmentId);

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Check if payment already exists and is successful
      const existingPayment =
        await paymentRepository.findPaymentByAppointmentId(appointmentId);

      if (existingPayment && existingPayment.status === "SUCCESS") {
        throw new Error("Appointment is already paid");
      }

      // Get consultation fee
      const consultationFee = appointment.consultation_fee || 500;

      // Check if patient has paid registration fee
      const patientUser = await patientRepository.findUserById(
        appointment.patient_id,
      );
      if (!patientUser) {
        throw new Error("Patient user not found");
      }

      const hasPatientPaidRegistrationFee =
        await patientRepository.hasPatientPaidRegistrationFee(patientUser.id);

      // Add registration fee (₹100) for new patients
      const registrationFee = hasPatientPaidRegistrationFee ? 0 : 100;
      const totalAmount = consultationFee + registrationFee;
      const amountInPaise = totalAmount * 100; // Convert to paise

      logger.info(
        `💰 Payment link calculation for appointment ${appointmentId}: Consultation Fee: ₹${consultationFee}, Registration Fee: ₹${registrationFee}, Total: ₹${totalAmount}`,
      );

      const expireBy = Math.floor(Date.now() / 1000) + 30 * 60;
      // Create Razorpay payment link
      const paymentLink = await razorpayUtil.createPaymentLink(
        amountInPaise,
        patientName,
        patientPhone,
        `Consultation with ${appointment.clinician_name}`,
        `appointment_${appointmentId}`,
        expireBy,
      );

      logger.info(
        `✅ Payment link created: ${paymentLink.short_url} for appointment ${appointmentId}`,
      );

      // Store payment link in database
      if (existingPayment) {
        // Update existing payment record with payment link
        await paymentRepository.updatePaymentLink(
          existingPayment.id,
          paymentLink.id,
          paymentLink.short_url,
        );
      } else {
        // Create new payment record with payment link
        await paymentRepository.createPayment({
          patientId: appointment.patient_id,
          appointmentId: appointmentId,
          orderId: paymentLink.id,
          amount: totalAmount,
          currency: "INR",
          paymentLinkId: paymentLink.id,
          paymentLinkUrl: paymentLink.short_url,
          consultationFee: consultationFee,
          registrationFee: registrationFee,
        });
      }

      // Format appointment date and time
      const appointmentDate = new Date(appointment.scheduled_start_at);
      const dateStr = appointmentDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = appointmentDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Send payment link via WhatsApp using template
      let whatsappSent = false;
      if (gallaboxUtil.isReady()) {
        // Calculate expiry in minutes from Razorpay payment link
        const expiryMinutes = Math.ceil(
          (new Date(paymentLink.expire_by * 1000).getTime() - Date.now()) /
            60000,
        );

        // Use template-based message with template ID: 699c48e93b39da99b4ff2047
        const result = await gallaboxUtil.sendPaymentLinkTemplate(
          patientPhone,
          patientName,
          paymentLink.short_url,
          expiryMinutes,
          appointmentId,
        );

        whatsappSent = result.success;

        if (whatsappSent) {
          logger.info(
            `✅ Payment link template sent via WhatsApp to ${patientPhone} for appointment ${appointmentId}`,
          );
        } else {
          logger.warn(
            `⚠️ Failed to send payment link template via WhatsApp to ${patientPhone}`,
          );
        }
      } else {
        logger.warn(
          "Gallabox not configured, payment link not sent via WhatsApp",
        );
      }

      return {
        paymentLink: paymentLink.short_url,
        whatsappSent,
        amount: totalAmount,
        expiresAt: new Date(paymentLink.expire_by * 1000), // Convert Unix timestamp to Date
      };
    } catch (error: any) {
      logger.error("Error sending payment link:", error);
      throw error;
    }
  }

  // ─── ADMIN BOOKING FLOW ──────────────────────────────────────────────────────
  // The three methods below are exclusively for the admin-created appointment
  // flow (FRONT_DESK / CARE_COORDINATOR / MANAGER books on behalf of a patient).
  // Do NOT call them from patient-facing routes or the patient payment flow.
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Handle payment failure or cancellation from the frontend.
   * Marks the payment FAILED and immediately cancels the appointment — no retry.
   */
  async handlePaymentFailure(
    userId: number,
    data: {
      appointmentId: number;
      razorpayOrderId: string;
      errorCode?: string;
      errorDescription?: string;
    },
  ): Promise<void> {
    const patient = await patientRepository.findPatientProfileByUserId(userId);
    if (!patient) throw new Error("Patient profile not found");

    const appointment = await bookingRepository.findAppointmentByIdAndPatient(
      data.appointmentId,
      patient.id,
    );
    if (!appointment) throw new Error("Appointment not found");

    await paymentRepository.updatePaymentFailed(
      data.razorpayOrderId,
      data.errorCode || "PAYMENT_CANCELLED",
      data.errorDescription || "Payment was cancelled or failed by user",
    );

    await appointmentRepository.rollbackAppointment(data.appointmentId);

    logger.info(
      `⚠️ Payment failure recorded for order ${data.razorpayOrderId} — appointment ${data.appointmentId} cancelled and slot freed`,
    );
  }

  /**
   * [ADMIN BOOKING FLOW ONLY]
   * Create a Razorpay payment link and send it to the patient via WhatsApp.
   * Called by appointmentService.createAppointment immediately after the
   * appointment row is inserted with status BOOKED.
   *
   * Video link generation and notifications are intentionally deferred —
   * they only fire once payment is confirmed (see verifyAdminBookingPayment).
   */
  async sendAdminBookingPaymentLink(appointmentId: number): Promise<{
    paymentLink: string;
    whatsappSent: boolean;
    amount: number;
    expiresAt: Date;
  }> {
    const appointment =
      await bookingRepository.findAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const existingPayment =
      await paymentRepository.findPaymentByAppointmentId(appointmentId);
    if (existingPayment && existingPayment.status === "SUCCESS") {
      throw new Error("Appointment is already paid");
    }

    const consultationFee = appointment.consultation_fee || 500;

    // Derive user_id via patient_profiles to check registration fee
    const patientProfile =
      await patientRepository.findPatientProfileByPatientId(
        appointment.patient_id,
      );
    if (!patientProfile) {
      throw new Error("Patient profile not found");
    }
    const hasPatientPaidRegistrationFee =
      await patientRepository.hasPatientPaidRegistrationFee(
        patientProfile.user_id,
      );

    const registrationFee = hasPatientPaidRegistrationFee ? 0 : 100;
    const totalAmount = consultationFee + registrationFee;
    const amountInPaise = totalAmount * 100;

    logger.info(
      `💰 [Admin] Payment link calculation for appointment ${appointmentId}: ` +
        `Consultation ₹${consultationFee}, Registration ₹${registrationFee}, Total ₹${totalAmount}`,
    );

    const expireBy = Math.floor(Date.now() / 1000) + 30 * 60; // 30-minute window

    const paymentLink = await razorpayUtil.createPaymentLink(
      amountInPaise,
      appointment.patient_name,
      appointment.patient_phone,
      `Consultation with ${appointment.clinician_name}`,
      `appointment_${appointmentId}`,
      expireBy,
    );

    if (existingPayment) {
      await paymentRepository.updatePaymentLink(
        existingPayment.id,
        paymentLink.id,
        paymentLink.short_url,
      );
    } else {
      await paymentRepository.createPayment({
        patientId: appointment.patient_id,
        appointmentId,
        orderId: paymentLink.id,
        amount: totalAmount,
        currency: "INR",
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.short_url,
        consultationFee,
        registrationFee,
      });
    }

    const expiryMinutes = Math.ceil(
      (new Date(paymentLink.expire_by * 1000).getTime() - Date.now()) / 60000,
    );

    let whatsappSent = false;
    if (gallaboxUtil.isReady()) {
      const result = await gallaboxUtil.sendPaymentLinkTemplate(
        appointment.patient_phone,
        appointment.patient_name,
        paymentLink.short_url,
        expiryMinutes,
        appointmentId,
      );
      whatsappSent = result.success;

      if (whatsappSent) {
        logger.info(
          `✅ [Admin] Payment link sent via WhatsApp to ${appointment.patient_phone} for appointment ${appointmentId}`,
        );
      } else {
        logger.warn(
          `⚠️ [Admin] Failed to send payment link via WhatsApp to ${appointment.patient_phone}`,
        );
      }
    } else {
      logger.warn(
        "[Admin] Gallabox not configured, payment link not sent via WhatsApp",
      );
    }

    return {
      paymentLink: paymentLink.short_url,
      whatsappSent,
      amount: totalAmount,
      expiresAt: new Date(paymentLink.expire_by * 1000),
    };
  }

  /**
   * [ADMIN BOOKING FLOW ONLY]
   * Called from handleWebhook when Razorpay fires payment_link.paid.
   * Updates the appointment to CONFIRMED, then triggers video link generation
   * and all notifications (patient, doctor, admins) for ONLINE appointments,
   * or sends a plain confirmation for IN_PERSON appointments.
   */
  async verifyAdminBookingPayment(paymentLinkId: string): Promise<any | null> {
    try {
      logger.info(
        `[Admin] Processing payment_link.paid webhook for link ${paymentLinkId}`,
      );

      // Use database transaction for atomicity
      return await db.tx(async (t) => {
        // Find payment by payment_link_id
        const payment = await t.oneOrNone(
          "SELECT * FROM payments WHERE payment_link_id = $1 ORDER BY created_at DESC LIMIT 1",
          [paymentLinkId],
        );

        if (!payment) {
          logger.warn(
            `[Admin] No payment record found for payment link ${paymentLinkId}`,
          );
          return null;
        }

        if (payment.status === "SUCCESS") {
          logger.info(
            `[Admin] Payment ${paymentLinkId} already processed (status: SUCCESS), skipping`,
          );
          return null;
        }

        logger.info(
          `[Admin] Found payment record ${payment.id} for appointment ${payment.appointment_id}`,
        );

        // Update payment status to SUCCESS using the new method
        await t.none(
          `UPDATE payments
           SET payment_id = $1,
               status = 'SUCCESS',
               paid_at = NOW(),
               payment_method_details = $2,
               error_code = NULL,
               error_description = NULL,
               updated_at = NOW()
           WHERE id = $3`,
          [
            paymentLinkId, // Use payment_link_id as payment_id
            { method: "payment_link" },
            payment.id,
          ],
        );

        logger.info(
          `[Admin] Payment ${payment.id} marked as SUCCESS for appointment ${payment.appointment_id}`,
        );

        // Mark registration fee paid if this payment included it
        if (payment.registration_fee && payment.registration_fee > 0) {
          const patientProfile = await t.oneOrNone(
            "SELECT * FROM patient_profiles WHERE id = $1",
            [payment.patient_id],
          );

          if (patientProfile) {
            await t.none(
              "UPDATE users SET has_paid_registration_fee = TRUE WHERE id = $1",
              [patientProfile.user_id],
            );
            logger.info(
              `✅ [Admin] Registration fee marked as paid for patient ${payment.patient_id}`,
            );
          }
        }

        // Update appointment status to CONFIRMED
        await t.none(
          `UPDATE appointments
           SET status = $1, is_active = TRUE, updated_at = NOW()
           WHERE id = $2`,
          ["CONFIRMED", payment.appointment_id],
        );

        logger.info(
          `✅ [Admin] Appointment ${payment.appointment_id} confirmed after payment link ${paymentLinkId} paid`,
        );

        // Fetch complete appointment details
        const appointment = await t.oneOrNone(
          `SELECT 
            a.*,
            u.full_name as clinician_name,
            cp.specialization,
            cp.consultation_fee,
            c.name as centre_name,
            c.address_line1,
            c.address_line2,
            c.city,
            c.pincode,
            c.contact_phone,
            pu.full_name as patient_name,
            pu.phone as patient_phone,
            pu.email as patient_email
          FROM appointments a
          JOIN clinician_profiles cp ON a.clinician_id = cp.id
          JOIN users u ON cp.user_id = u.id
          JOIN centres c ON a.centre_id = c.id
          JOIN patient_profiles pp ON a.patient_id = pp.id
          JOIN users pu ON pp.user_id = pu.id
          WHERE a.id = $1`,
          [payment.appointment_id],
        );

        if (!appointment) {
          logger.error(
            `[Admin] Appointment ${payment.appointment_id} not found after confirmation`,
          );
          return null;
        }

        return appointment;
      });
    } catch (error: any) {
      logger.error(
        `[Admin] Error in verifyAdminBookingPayment for link ${paymentLinkId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * [ADMIN BOOKING FLOW ONLY]
   * Called from handleWebhook when payment_link.expired fires.
   * Rolls back the appointment to CANCELLED and deactivates it so the slot
   * becomes available again for new bookings.
   */
  private async rollbackAdminBookingAppointment(
    paymentLinkId: string,
  ): Promise<void> {
    try {
      logger.info(
        `[Admin] Processing payment_link.expired webhook for link ${paymentLinkId}`,
      );

      // Use database transaction for atomicity
      await db.tx(async (t) => {
        const payment = await t.oneOrNone(
          "SELECT * FROM payments WHERE payment_link_id = $1 ORDER BY created_at DESC LIMIT 1",
          [paymentLinkId],
        );

        if (!payment) {
          logger.warn(
            `[Admin] No payment record found for expired link ${paymentLinkId}`,
          );
          return;
        }

        logger.info(
          `[Admin] Found payment record ${payment.id} for appointment ${payment.appointment_id}`,
        );

        // Update payment as failed
        await t.none(
          `UPDATE payments 
           SET status = 'FAILED',
               error_code = $1,
               error_description = $2,
               updated_at = NOW()
           WHERE id = $3`,
          ["LINK_EXPIRED", "Payment link expired without payment", payment.id],
        );

        // Rollback appointment (only if status is still BOOKED)
        await t.none(
          `UPDATE appointments
           SET status = 'CANCELLED', is_active = FALSE, updated_at = NOW()
           WHERE id = $1 AND status = 'BOOKED'`,
          [payment.appointment_id],
        );

        logger.info(
          `⚠️ [Admin] Appointment ${payment.appointment_id} rolled back — payment link ${paymentLinkId} expired`,
        );
      });
    } catch (error: any) {
      logger.error(
        `[Admin] Error in rollbackAdminBookingAppointment for link ${paymentLinkId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * [ADMIN BOOKING FLOW ONLY]
   * Dedicated Razorpay webhook handler for admin-created appointments.
   * Handles payment_link.paid (confirm + notify via appointmentService) and
   * payment_link.expired (rollback appointment).
   * Register this on a separate route from the patient-flow handleWebhook.
   */
  async handleAdminWebhook(signature: string, payload: any): Promise<void> {
    try {
      const webhookEvent = await paymentRepository.storeWebhookEvent({
        provider: "RAZORPAY",
        providerEventId: payload.event,
        eventType: payload.event,
        rawPayload: payload,
      });

      const isValid = razorpayUtil.verifyAdminWebhookSignature(
        JSON.stringify(payload),
        signature,
      );

      if (!isValid) {
        logger.warn("[Admin] Invalid webhook signature");
        return;
      }

      const event = payload.event;
      const paymentLinkEntity = payload.payload?.payment_link?.entity;

      if (event === "payment_link.paid" && paymentLinkEntity?.id) {
        const appointment = await this.verifyAdminBookingPayment(
          paymentLinkEntity.id,
        );
        if (appointment) {
          const { appointmentService } = await import("./appointment.services");
          await appointmentService.handleAdminBookingConfirmed(appointment);
        }
      } else if (event === "payment_link.expired" && paymentLinkEntity?.id) {
        await this.rollbackAdminBookingAppointment(paymentLinkEntity.id);
      }

      await paymentRepository.markWebhookProcessed(webhookEvent.id);
    } catch (error: any) {
      logger.error("[Admin] Error handling admin webhook:", error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
