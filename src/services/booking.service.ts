// src/services/booking.service.ts
import { bookingRepository } from "../repositories/booking.repository";
import { patientRepository } from "../repositories/patient.repository";
import { slotRepository } from "../repositories/slot.repository";
import { googleMeetUtil } from "../utils/googleMeet";
import logger from "../config/logger";

interface BookingData {
  clinicianId: number;
  centreId: number;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  appointmentType: "ONLINE" | "IN_PERSON";
  appointmentDateUTC: string;
  notes?: string;
  patientNotes?: string;
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
      // Get patient profile with user data
      const patientData = await patientRepository.findByUserId(userId);
      if (!patientData) {
        throw new Error("Patient profile not found");
      }

      const patient = {
        ...patientData.profile,
        full_name: patientData.user.full_name,
        email: patientData.user.email,
        phone: patientData.user.phone,
      };

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
      const appointmentDateTime = new Date(bookingData.appointmentDateUTC);

      // Validate appointment is in the future
      if (appointmentDateTime.getTime() <= new Date().getTime()) {
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

      // Check if slot is blocked
      const appointmentDate = bookingData.appointmentDateUTC.split("T")[0];
      const appointmentTime = appointmentDateTime.toTimeString().split(" ")[0];
      const endTime = endDateTime.toTimeString().split(" ")[0];

      const isBlocked = await slotRepository.isSlotBlocked(
        bookingData.clinicianId,
        bookingData.centreId,
        appointmentDate,
        appointmentTime,
        endTime,
      );

      if (isBlocked) {
        throw new Error(
          "This time slot has been blocked. Please choose a different time.",
        );
      }

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
        patientNotes: bookingData.patientNotes,
      });

      // Generate Google Meet link for online appointments
      let googleMeetLink = null;
      let googleCalendarEventId = null;

      if (bookingData.appointmentType === "ONLINE") {
        try {
          const meetResult =
            await googleMeetUtil.createMeetLinkForAppointmentFromFrontend(
              patient.full_name || "Patient",
              clinician.clinician_name || "Clinician",
              patient.email || "",
              appointmentDateTime.toISOString(),
              endDateTime.toISOString(),
            );

          googleMeetLink = meetResult.meetLink;
          googleCalendarEventId = meetResult.eventId;

          // Update appointment with Google Meet details
          await bookingRepository.updateAppointmentGoogleMeet(
            appointment.id,
            googleMeetLink,
            googleCalendarEventId,
          );

          logger.info(
            `✅ Google Meet link generated for appointment ${appointment.id}: ${googleMeetLink}`,
          );
        } catch (error: any) {
          logger.error(
            `Failed to generate Google Meet link for appointment ${appointment.id}:`,
            error,
          );
          // Don't fail the appointment creation if Google Meet fails
        }
      }

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
   * Get dates with available slots for a clinician within a date range
   * Returns array of dates that have at least one available slot
   */
  async getDatesWithSlots(
    clinicianId: number,
    centreId: number | undefined,
    startDate: string,
    endDate: string,
  ): Promise<{ date: string; slotCount: number; firstSlot?: string }[]> {
    try {
      // Validate clinician
      const clinician = await bookingRepository.findClinicianById(clinicianId);
      if (!clinician) {
        throw new Error("Clinician not found");
      }

      // Get all centres for this clinician if centreId not specified
      let centreIds: number[] = [];
      if (centreId) {
        const centre = await bookingRepository.findCentreById(centreId);
        if (!centre) {
          throw new Error("Centre not found");
        }
        centreIds = [centreId];
      } else {
        // Get all centres where this clinician works
        const centres =
          await bookingRepository.getClinicianCentres(clinicianId);
        centreIds = centres.map((c) => c.centre_id);

        // Fallback: if no availability rules found, use primary centre
        if (centreIds.length === 0 && clinician.primary_centre_id) {
          logger.warn(
            `No availability rules found for clinician ${clinicianId}, using primary centre ${clinician.primary_centre_id}`,
          );
          centreIds = [clinician.primary_centre_id];
        }
      }

      // If still no centres found, return empty array
      if (centreIds.length === 0) {
        logger.warn(`No centres found for clinician ${clinicianId}`);
        return [];
      }

      // Use appointment service to get availability for date range
      const { appointmentService } = await import("./appointment.services");

      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");
      const dateSlotMap = new Map<
        string,
        { slotCount: number; firstSlot: string | null }
      >();

      // Iterate through each date in the range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD

        let totalAvailableForDate = 0;
        let firstAvailableSlot: string | null = null;

        // Check slots across all centres
        for (const cId of centreIds) {
          try {
            const slots = await appointmentService.checkClinicianAvailability(
              clinicianId,
              cId,
              dateStr,
            );

            // Filter available slots
            const availableSlots = slots.filter((slot) => slot.available);
            const availableCount = availableSlots.length;
            totalAvailableForDate += availableCount;

            // Get the first available slot time if we don't have one yet
            if (!firstAvailableSlot && availableSlots.length > 0) {
              firstAvailableSlot = availableSlots[0].startTime;
            }
          } catch (error) {
            // Skip centres/dates with errors (e.g., no schedule defined)
            logger.debug(
              `No slots for date ${dateStr} at centre ${cId}:`,
              error,
            );
          }
        }

        if (totalAvailableForDate > 0) {
          dateSlotMap.set(dateStr, {
            slotCount: totalAvailableForDate,
            firstSlot: firstAvailableSlot,
          });
        }
      }

      // Convert map to array
      const datesWithSlots: {
        date: string;
        slotCount: number;
        firstSlot?: string;
      }[] = [];
      dateSlotMap.forEach((value, date) => {
        datesWithSlots.push({
          date,
          slotCount: value.slotCount,
          firstSlot: value.firstSlot || undefined,
        });
      });

      return datesWithSlots;
    } catch (error: any) {
      logger.error("Error getting dates with slots:", error);
      throw error;
    }
  }

  /**
   * Get clinician slots within a date range (for admin panel)
   * Returns all slots (available and booked) for the specified date range
   */
  async getClinicianSlotsRange(
    clinicianId: number,
    startDate: string,
    endDate: string,
    centreId?: number,
  ): Promise<any[]> {
    try {
      // Validate clinician
      const clinician = await bookingRepository.findClinicianById(clinicianId);
      if (!clinician) {
        throw new Error("Clinician not found");
      }

      // Use appointment service to get availability for date range
      const { appointmentService } = await import("./appointment.services");

      const start = new Date(startDate);
      const end = new Date(endDate);
      const allSlots: any[] = [];

      // Iterate through each date in the range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD

        try {
          const slots = await appointmentService.checkClinicianAvailability(
            clinicianId,
            centreId || clinician.primary_centre_id,
            dateStr,
          );

          // Transform slots to match expected format
          const transformedSlots = slots.map((slot: any) => ({
            clinicianId: clinicianId.toString(),
            centreId: (centreId || clinician.primary_centre_id).toString(),
            date: dateStr,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: slot.available ? "available" : "booked",
            mode: "IN_PERSON",
          }));

          allSlots.push(...transformedSlots);
        } catch (error) {
          // Skip dates with errors (e.g., no schedule defined)
          logger.debug(`No slots for date ${dateStr}:`, error);
        }
      }

      return allSlots;
    } catch (error: any) {
      logger.error("Error getting clinician slots range:", error);
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

        // Split name into first and last name
        const nameParts = bookingData.patientName.trim().split(" ");
        const firstName = nameParts[0] || bookingData.patientName;
        const lastName = nameParts.slice(1).join(" ") || "";

        // Create user first
        patient = await patientRepository.createUser(
          bookingData.patientPhone,
          firstName,
          lastName,
          bookingData.patientEmail || undefined,
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

      // Check if slot is blocked
      const appointmentTime = appointmentDateTime.toTimeString().split(" ")[0];
      const endTime = endDateTime.toTimeString().split(" ")[0];

      const isBlocked = await slotRepository.isSlotBlocked(
        bookingData.clinicianId,
        bookingData.centreId,
        bookingData.appointmentDate,
        appointmentTime,
        endTime,
      );

      if (isBlocked) {
        throw new Error(
          "This time slot has been blocked. Please choose a different time.",
        );
      }

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

      // Generate Google Meet link for online appointments
      let googleMeetLink = null;
      let googleCalendarEventId = null;

      if (bookingData.appointmentType === "ONLINE") {
        try {
          const meetResult =
            await googleMeetUtil.createMeetLinkForAppointmentFromFrontend(
              bookingData.patientName,
              clinician.clinician_name || "Clinician",
              bookingData.patientEmail || "",
              appointmentDateTime.toISOString(),
              endDateTime.toISOString(),
            );

          googleMeetLink = meetResult.meetLink;
          googleCalendarEventId = meetResult.eventId;

          // Update appointment with Google Meet details
          await bookingRepository.updateAppointmentGoogleMeet(
            appointment.id,
            googleMeetLink,
            googleCalendarEventId,
          );

          logger.info(
            `✅ Google Meet link generated for front desk appointment ${appointment.id}: ${googleMeetLink}`,
          );
        } catch (error: any) {
          logger.error(
            `Failed to generate Google Meet link for front desk appointment ${appointment.id}:`,
            error,
          );
          // Don't fail the appointment creation if Google Meet fails
        }
      }

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
