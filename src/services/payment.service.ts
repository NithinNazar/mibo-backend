// src/services/payment.service.ts
import { paymentRepository } from "../repositories/payment.repository";
import { bookingRepository } from "../repositories/booking.repository";
import { patientRepository } from "../repositories/patient.repository";
import { razorpayUtil } from "../utils/razorpay";
import { gallaboxUtil } from "../utils/gallabox";
import { googleMeetUtil } from "../utils/google-meet";
import logger from "../config/logger";

class PaymentService {
  /**
   * Create Razorpay order for appointment
   */
  async createPaymentOrder(
    userId: number,
    appointmentId: number
  ): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
    appointment: any;
  }> {
    try {
      // Get patient profile
      const patient = await patientRepository.findPatientProfileByUserId(
        userId
      );
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Get appointment details
      const appointment = await bookingRepository.findAppointmentByIdAndPatient(
        appointmentId,
        patient.id
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
      const amountInPaise = consultationFee * 100; // Convert to paise

      // Create Razorpay order
      const razorpayOrder = await razorpayUtil.createOrder(
        amountInPaise,
        "INR",
        `appointment_${appointmentId}`,
        {
          appointmentId: appointmentId.toString(),
          patientId: patient.id.toString(),
          clinicianName: appointment.clinician_name,
        }
      );

      // Store payment record in database
      await paymentRepository.createPayment({
        patientId: patient.id,
        appointmentId: appointmentId,
        orderId: razorpayOrder.id,
        amount: consultationFee,
        currency: "INR",
      });

      logger.info(
        `✅ Payment order created: ${razorpayOrder.id} for appointment ${appointmentId}`
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
    }
  ): Promise<{
    success: boolean;
    appointment: any;
    payment: any;
  }> {
    try {
      // Get patient profile
      const patient = await patientRepository.findPatientProfileByUserId(
        userId
      );
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Verify appointment belongs to patient
      const appointment = await bookingRepository.findAppointmentByIdAndPatient(
        data.appointmentId,
        patient.id
      );

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Verify payment signature
      const isValidSignature = razorpayUtil.verifyPaymentSignature(
        data.razorpayOrderId,
        data.razorpayPaymentId,
        data.razorpaySignature
      );

      if (!isValidSignature) {
        // Update payment as failed
        await paymentRepository.updatePaymentFailed(
          data.razorpayOrderId,
          "SIGNATURE_VERIFICATION_FAILED",
          "Payment signature verification failed"
        );

        throw new Error("Payment verification failed. Invalid signature.");
      }

      // Fetch payment details from Razorpay
      const razorpayPayment = await razorpayUtil.fetchPayment(
        data.razorpayPaymentId
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
        }
      );

      // Update appointment status to CONFIRMED
      await bookingRepository.updateAppointmentStatus(
        data.appointmentId,
        "CONFIRMED"
      );

      logger.info(
        `✅ Payment verified: ${data.razorpayPaymentId} for appointment ${data.appointmentId}`
      );

      // Send WhatsApp confirmation
      await this.sendPaymentConfirmation(appointment, payment, patient);

      // Get updated appointment details
      const updatedAppointment = await bookingRepository.findAppointmentById(
        data.appointmentId
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
    patient: any
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
      const dateStr = appointmentDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = appointmentDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Check if appointment is ONLINE type
      const isOnlineAppointment = appointment.appointment_type === "ONLINE";

      if (isOnlineAppointment) {
        // Create Google Meet link for online appointments
        try {
          logger.info(
            `📹 Creating Google Meet link for online appointment ${appointment.id}`
          );

          // Extract date and time for Google Meet
          const appointmentDateOnly = appointmentDate
            .toISOString()
            .split("T")[0]; // YYYY-MM-DD
          const appointmentTimeOnly = appointmentDate
            .toTimeString()
            .substring(0, 5); // HH:MM

          const meetingDetails = await googleMeetUtil.createMeetingLink({
            patientName: user.full_name,
            clinicianName: appointment.clinician_name,
            appointmentDate: appointmentDateOnly,
            appointmentTime: appointmentTimeOnly,
            durationMinutes: 50,
          });

          // Store Google Meet link in database
          await bookingRepository.updateAppointmentGoogleMeet(
            appointment.id,
            meetingDetails.meetLink,
            meetingDetails.eventId
          );

          logger.info(
            `✅ Google Meet link created: ${meetingDetails.meetLink}`
          );

          // Send online consultation confirmation with Google Meet link
          if (gallaboxUtil.isReady()) {
            await gallaboxUtil.sendOnlineConsultationConfirmation(
              user.phone,
              user.full_name,
              appointment.clinician_name,
              dateStr,
              timeStr,
              meetingDetails.meetLink
            );

            logger.info(
              `✅ WhatsApp online consultation confirmation sent to ${user.phone} with Google Meet link`
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
              appointment.centre_name
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
            appointment.centre_name
          );

          logger.info(
            `✅ WhatsApp confirmation sent to ${user.phone} for appointment ${appointment.id}`
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
        signature
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
          // Update appointment status
          await bookingRepository.updateAppointmentStatus(
            payment.appointment_id,
            "CONFIRMED"
          );

          logger.info(
            `✅ Webhook processed: Payment ${paymentId} captured for appointment ${payment.appointment_id}`
          );
        }
      } else if (event === "payment.failed" && paymentEntity) {
        // Payment failed
        const orderId = paymentEntity.order_id;

        await paymentRepository.updatePaymentFailed(
          orderId,
          paymentEntity.error_code,
          paymentEntity.error_description
        );

        logger.info(
          `⚠️ Webhook processed: Payment failed for order ${orderId}`
        );
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
      const patient = await patientRepository.findPatientProfileByUserId(
        userId
      );
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Get payment
      const payment = await paymentRepository.findPaymentByAppointmentId(
        appointmentId
      );

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
    }
  ): Promise<any[]> {
    try {
      // Get patient profile
      const patient = await patientRepository.findPatientProfileByUserId(
        userId
      );
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Get payments
      const payments = await paymentRepository.getPatientPayments(
        patient.id,
        filters
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
}

export const paymentService = new PaymentService();
