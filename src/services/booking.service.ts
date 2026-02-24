// src/services/booking.service.ts
import { bookingRepository } from "../repositories/booking.repository";
import { patientRepository } from "../repositories/patient.repository";
import logger from "../config/logger";

interface BookingData {
  clinicianId: number;
  centreId: number;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  appointmentType: "ONLINE" | "IN_PERSON";
  notes?: string;
}

class BookingService {
  /**
   * Validate and create appointment
   */
  async createAppointment(
    userId: number,
    bookingData: BookingData,
  ): Promise<{
    appointment: any;
    clinician: any;
    centre: any;
    patient: any;
  }> {
    try {
      // Get patient profile
      const patient =
        await patientRepository.findPatientProfileByUserId(userId);
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Validate clinician
      const clinician = await bookingRepository.findClinicianById(
        bookingData.clinicianId,
      );
      if (!clinician) {
        throw new Error("Clinician not found or inactive");
      }

      // Validate centre
      const centre = await bookingRepository.findCentreById(
        bookingData.centreId,
      );
      if (!centre) {
        throw new Error("Centre not found or inactive");
      }

      // Validate appointment type
      if (
        bookingData.appointmentType !== "ONLINE" &&
        bookingData.appointmentType !== "IN_PERSON"
      ) {
        throw new Error("Invalid appointment type");
      }

      // Parse date and time
      const appointmentDateTime = new Date(
        `${bookingData.appointmentDate}T${bookingData.appointmentTime}:00`,
      );

      // Validate appointment is in the future
      if (appointmentDateTime <= new Date()) {
        throw new Error(
          "Appointment must be scheduled for a future date and time",
        );
      }

      // Calculate end time based on clinician's default duration
      const durationMinutes =
        clinician.default_consultation_duration_minutes || 30;
      const endDateTime = new Date(
        appointmentDateTime.getTime() + durationMinutes * 60000,
      );

      // Check if time slot is available
      const isAvailable = await bookingRepository.isTimeSlotAvailable(
        bookingData.clinicianId,
        bookingData.centreId,
        appointmentDateTime,
        endDateTime,
      );

      if (!isAvailable) {
        throw new Error(
          "This time slot is not available. Please choose a different time.",
        );
      }

      // Create appointment
      const appointment = await bookingRepository.createAppointment({
        patientId: patient.id,
        clinicianId: bookingData.clinicianId,
        centreId: bookingData.centreId,
        appointmentType: bookingData.appointmentType,
        scheduledStartAt: appointmentDateTime,
        scheduledEndAt: endDateTime,
        durationMinutes: durationMinutes,
        bookedByUserId: userId,
        source: "WEB_PATIENT",
        notes: bookingData.notes,
      });

      logger.info(
        `✅ Appointment created: ID ${appointment.id} for patient ${patient.id}`,
      );

      // Get full appointment details
      const fullAppointment = await bookingRepository.findAppointmentById(
        appointment.id,
      );

      return {
        appointment: {
          id: fullAppointment.id,
          appointmentType: fullAppointment.appointment_type,
          scheduledStartAt: fullAppointment.scheduled_start_at,
          scheduledEndAt: fullAppointment.scheduled_end_at,
          durationMinutes: fullAppointment.duration_minutes,
          status: fullAppointment.status,
          notes: fullAppointment.notes,
        },
        clinician: {
          id: clinician.id,
          name: fullAppointment.clinician_name,
          specialization: clinician.specialization,
          consultationFee: clinician.consultation_fee,
        },
        centre: {
          id: centre.id,
          name: centre.name,
          address: `${centre.address_line1}${
            centre.address_line2 ? ", " + centre.address_line2 : ""
          }`,
          city: centre.city,
          pincode: centre.pincode,
          phone: centre.contact_phone,
        },
        patient: {
          id: patient.id,
          name: fullAppointment.patient_name,
          phone: fullAppointment.patient_phone,
          email: fullAppointment.patient_email,
        },
      };
    } catch (error: any) {
      logger.error("Error creating appointment:", error);
      throw error;
    }
  }

  /**
   * Get appointment details
   */
  async getAppointmentDetails(
    appointmentId: number,
    userId: number,
  ): Promise<any> {
    try {
      // Get patient profile
      const patient =
        await patientRepository.findPatientProfileByUserId(userId);
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Get appointment with patient verification
      const appointment = await bookingRepository.findAppointmentByIdAndPatient(
        appointmentId,
        patient.id,
      );

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      return {
        id: appointment.id,
        appointmentType: appointment.appointment_type,
        scheduledStartAt: appointment.scheduled_start_at,
        scheduledEndAt: appointment.scheduled_end_at,
        durationMinutes: appointment.duration_minutes,
        status: appointment.status,
        notes: appointment.notes,
        clinician: {
          name: appointment.clinician_name,
          specialization: appointment.specialization,
          consultationFee: appointment.consultation_fee,
        },
        centre: {
          name: appointment.centre_name,
          address: `${appointment.address_line1}${
            appointment.address_line2 ? ", " + appointment.address_line2 : ""
          }`,
          city: appointment.city,
          pincode: appointment.pincode,
          phone: appointment.contact_phone,
        },
      };
    } catch (error: any) {
      logger.error("Error getting appointment details:", error);
      throw error;
    }
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(
    userId: number,
    filters?: {
      status?: string;
      upcoming?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
    appointments: any[];
    total: number;
  }> {
    try {
      // Get patient profile
      const patient =
        await patientRepository.findPatientProfileByUserId(userId);
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Get appointments
      const appointments = await bookingRepository.getPatientAppointments(
        patient.id,
        filters,
      );

      // Format appointments
      const formattedAppointments = appointments.map((apt) => ({
        id: apt.id,
        appointmentType: apt.appointment_type,
        scheduledStartAt: apt.scheduled_start_at,
        scheduledEndAt: apt.scheduled_end_at,
        status: apt.status,
        clinician: {
          name: apt.clinician_name,
          specialization: apt.specialization,
        },
        centre: {
          name: apt.centre_name,
          address: apt.address_line1,
          city: apt.city,
        },
        payment: {
          status: apt.payment_status,
          amount: apt.payment_amount,
        },
        meetLink: apt.meet_link,
      }));

      return {
        appointments: formattedAppointments,
        total: formattedAppointments.length,
      };
    } catch (error: any) {
      logger.error("Error getting patient appointments:", error);
      throw error;
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: number,
    userId: number,
    reason?: string,
  ): Promise<void> {
    try {
      // Get patient profile
      const patient =
        await patientRepository.findPatientProfileByUserId(userId);
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      // Verify appointment belongs to patient
      const appointment = await bookingRepository.findAppointmentByIdAndPatient(
        appointmentId,
        patient.id,
      );

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Check if appointment can be cancelled
      if (appointment.status === "CANCELLED") {
        throw new Error("Appointment is already cancelled");
      }

      if (appointment.status === "COMPLETED") {
        throw new Error("Cannot cancel completed appointment");
      }

      // Check if appointment is within 24 hours
      const appointmentTime = new Date(appointment.scheduled_start_at);
      const now = new Date();
      const hoursDifference =
        (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < 24) {
        throw new Error(
          "Cannot cancel appointment within 24 hours of scheduled time. Please contact support.",
        );
      }

      // Cancel appointment
      await bookingRepository.cancelAppointment(appointmentId, reason);

      logger.info(`✅ Appointment cancelled: ID ${appointmentId}`);
    } catch (error: any) {
      logger.error("Error cancelling appointment:", error);
      throw error;
    }
  }

  /**
   * Get available time slots for a clinician
   * (This is a simplified version - you can enhance it later)
   */
  async getAvailableSlots(
    clinicianId: number,
    centreId: number,
    date: string,
  ): Promise<any[]> {
    try {
      // Validate clinician and centre
      const clinician = await bookingRepository.findClinicianById(clinicianId);
      if (!clinician) {
        throw new Error("Clinician not found");
      }

      const centre = await bookingRepository.findCentreById(centreId);
      if (!centre) {
        throw new Error("Centre not found");
      }

      // Use appointment service to get real availability from database
      const { appointmentService } = await import("./appointment.services");
      const slots = await appointmentService.checkClinicianAvailability(
        clinicianId,
        centreId,
        date,
      );

      // Transform to match expected format
      return slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: slot.available,
      }));
    } catch (error: any) {
      logger.error("Error getting available slots:", error);
      throw error;
    }
  }

  /**
   * Book appointment for patient (Front Desk)
   * Creates or finds patient by phone, then books appointment
   */
  async bookForPatient(
    staffUserId: number,
    bookingData: {
      clinicianId: number;
      centreId: number;
      patientPhone: string;
      patientName: string;
      patientEmail?: string;
      appointmentType: "ONLINE" | "IN_PERSON";
      appointmentDate: string; // YYYY-MM-DD
      appointmentTime: string; // HH:MM
      notes?: string;
    },
  ): Promise<{
    appointment: any;
    patient: any;
    clinician: any;
    centre: any;
    paymentRequired: boolean;
    amount: number;
  }> {
    try {
      // Validate clinician
      const clinician = await bookingRepository.findClinicianById(
        bookingData.clinicianId,
      );
      if (!clinician) {
        throw new Error("Clinician not found or inactive");
      }

      // Validate centre
      const centre = await bookingRepository.findCentreById(
        bookingData.centreId,
      );
      if (!centre) {
        throw new Error("Centre not found or inactive");
      }

      // Find or create patient by phone
      let patient = await patientRepository.findUserByPhone(
        bookingData.patientPhone,
      );

      let patientProfile;

      if (!patient) {
        // Create new patient
        logger.info(
          `Creating new patient: ${bookingData.patientName} (${bookingData.patientPhone})`,
        );

        // Create user first
        patient = await patientRepository.createUser(
          bookingData.patientPhone,
          bookingData.patientName,
          bookingData.patientEmail,
        );

        // Create patient profile
        patientProfile = await patientRepository.createPatientProfile(
          patient.id,
        );

        logger.info(`✅ New patient created: ID ${patientProfile.id}`);
      } else {
        // Get existing patient profile
        patientProfile = await patientRepository.findPatientProfileByUserId(
          patient.id,
        );

        if (!patientProfile) {
          // Create profile if it doesn't exist
          patientProfile = await patientRepository.createPatientProfile(
            patient.id,
          );
        }
      }

      // Parse date and time
      const appointmentDateTime = new Date(
        `${bookingData.appointmentDate}T${bookingData.appointmentTime}:00`,
      );

      // Validate appointment is in the future
      if (appointmentDateTime <= new Date()) {
        throw new Error(
          "Appointment must be scheduled for a future date and time",
        );
      }

      // Calculate end time based on clinician's default duration
      const durationMinutes =
        clinician.default_consultation_duration_minutes || 30;
      const endDateTime = new Date(
        appointmentDateTime.getTime() + durationMinutes * 60000,
      );

      // Check if time slot is available
      const isAvailable = await bookingRepository.isTimeSlotAvailable(
        bookingData.clinicianId,
        bookingData.centreId,
        appointmentDateTime,
        endDateTime,
      );

      if (!isAvailable) {
        throw new Error(
          "This time slot is not available. Please choose a different time.",
        );
      }

      // Create appointment
      const appointment = await bookingRepository.createAppointment({
        patientId: patientProfile.id,
        clinicianId: bookingData.clinicianId,
        centreId: bookingData.centreId,
        appointmentType: bookingData.appointmentType,
        scheduledStartAt: appointmentDateTime,
        scheduledEndAt: endDateTime,
        durationMinutes: durationMinutes,
        bookedByUserId: staffUserId,
        source: "ADMIN_FRONT_DESK", // Mark as booked by front desk
        notes: bookingData.notes,
      });

      logger.info(
        `✅ Appointment booked by front desk: ID ${appointment.id} for patient ${patientProfile.id}`,
      );

      // Get full appointment details
      const fullAppointment = await bookingRepository.findAppointmentById(
        appointment.id,
      );

      return {
        appointment: {
          id: fullAppointment.id,
          appointmentType: fullAppointment.appointment_type,
          scheduledStartAt: fullAppointment.scheduled_start_at,
          scheduledEndAt: fullAppointment.scheduled_end_at,
          durationMinutes: fullAppointment.duration_minutes,
          status: fullAppointment.status,
          notes: fullAppointment.notes,
        },
        patient: {
          id: patientProfile.id,
          name: bookingData.patientName,
          phone: bookingData.patientPhone,
          email: bookingData.patientEmail,
        },
        clinician: {
          id: clinician.id,
          name: fullAppointment.clinician_name,
          specialization: clinician.specialization,
          consultationFee: clinician.consultation_fee,
        },
        centre: {
          id: centre.id,
          name: centre.name,
          address: `${centre.address_line1}${
            centre.address_line2 ? ", " + centre.address_line2 : ""
          }`,
          city: centre.city,
        },
        paymentRequired: true,
        amount: clinician.consultation_fee,
      };
    } catch (error: any) {
      logger.error("Error booking appointment for patient:", error);
      throw error;
    }
  }
}

export const bookingService = new BookingService();
