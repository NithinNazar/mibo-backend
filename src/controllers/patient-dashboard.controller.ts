// src/controllers/patient-dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { ok } from "../utils/response";
import { patientRepository } from "../repositories/patient.repository";
import { ApiError } from "../utils/apiError";

export class PatientDashboardController {
  /**
   * GET /api/patient/dashboard
   * Get patient dashboard with appointments and payments
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      // Get patient profile
      const patient = await patientRepository.findByUserId(req.user.userId);
      if (!patient) {
        throw ApiError.notFound("Patient profile not found");
      }

      // Get appointments
      const appointments = await patientRepository.getPatientAppointments(
        patient.profile.id,
      );

      // Get payments
      const payments = await patientRepository.getPatientPayments(
        patient.profile.id,
      );

      // Categorize appointments
      const now = new Date();
      const upcomingAppointments = appointments.filter(
        (apt: any) =>
          new Date(apt.scheduled_start_at) > now &&
          apt.status !== "CANCELLED" &&
          apt.status !== "COMPLETED",
      );

      const pastAppointments = appointments.filter(
        (apt: any) =>
          new Date(apt.scheduled_start_at) <= now ||
          apt.status === "COMPLETED" ||
          apt.status === "CANCELLED",
      );

      // Calculate statistics
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(
        (apt: any) => apt.status === "COMPLETED",
      ).length;
      const totalSpent = payments
        .filter((p: any) => p.status === "SUCCESS")
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

      return ok(res, {
        patient: {
          id: patient.profile.id,
          name: patient.user.full_name,
          firstName: patient.user.first_name,
          lastName: patient.user.last_name,
          phone: patient.user.phone,
          email: patient.user.email,
          date_of_birth: patient.profile.date_of_birth,
          age: patient.profile.age,
          gender: patient.profile.gender,
          blood_group: patient.profile.blood_group,
        },
        statistics: {
          totalAppointments,
          completedAppointments,
          upcomingAppointments: upcomingAppointments.length,
          totalSpent,
        },
        upcomingAppointments: upcomingAppointments.slice(0, 5), // Latest 5
        recentAppointments: pastAppointments.slice(0, 5), // Latest 5
        recentPayments: payments.slice(0, 5), // Latest 5
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/patient/appointments
   * Get all patient appointments
   */
  async getAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const patient = await patientRepository.findByUserId(req.user.userId);
      if (!patient) {
        throw ApiError.notFound("Patient profile not found");
      }

      const appointments = await patientRepository.getPatientAppointments(
        patient.profile.id,
      );

      return ok(res, { appointments });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/patient/payments
   * Get all patient payments
   */
  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const patient = await patientRepository.findByUserId(req.user.userId);
      if (!patient) {
        throw ApiError.notFound("Patient profile not found");
      }

      const payments = await patientRepository.getPatientPayments(
        patient.profile.id,
      );

      return ok(res, { payments });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/patient/profile
   * Get patient profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const patient = await patientRepository.findByUserId(req.user.userId);
      if (!patient) {
        throw ApiError.notFound("Patient profile not found");
      }

      return ok(res, {
        user: {
          id: patient.user.id,
          phone: patient.user.phone,
          full_name: patient.user.full_name,
          first_name: patient.user.first_name,
          last_name: patient.user.last_name,
          email: patient.user.email,
          created_at: patient.user.created_at,
        },
        profile: {
          id: patient.profile.id,
          date_of_birth: patient.profile.date_of_birth,
          age: patient.profile.age,
          gender: patient.profile.gender,
          blood_group: patient.profile.blood_group,
          emergency_contact_name: patient.profile.emergency_contact_name,
          emergency_contact_phone: patient.profile.emergency_contact_phone,
          notes: patient.profile.notes,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/patient/profile
   * Update patient profile (including completion of legacy user profiles)
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const patient = await patientRepository.findByUserId(req.user.userId);
      if (!patient) {
        throw ApiError.notFound("Patient profile not found");
      }

      // Extract user and profile data
      const {
        firstName,
        lastName,
        email,
        age,
        gender,
        dateOfBirth,
        ...otherProfileData
      } = req.body;

      // Update user info (name, email)
      if (firstName || lastName || email) {
        const userUpdates: any = {};
        if (firstName) userUpdates.first_name = firstName;
        if (lastName) userUpdates.last_name = lastName;
        if (firstName && lastName) {
          userUpdates.full_name = `${firstName} ${lastName}`.trim();
        }
        if (email !== undefined) userUpdates.email = email;

        if (Object.keys(userUpdates).length > 0) {
          await patientRepository.updateUser(req.user.userId, userUpdates);
        }
      }

      // Update patient profile (age, gender, dateOfBirth, etc.)
      const profileUpdates: any = { ...otherProfileData };
      if (age !== undefined) profileUpdates.age = age;
      if (gender) profileUpdates.gender = gender;
      if (dateOfBirth) {
        // Convert date string to Date object
        try {
          profileUpdates.date_of_birth = new Date(dateOfBirth);

          // Validate date is valid
          if (isNaN(profileUpdates.date_of_birth.getTime())) {
            throw new Error("Invalid date format");
          }
        } catch (dateError) {
          console.error("Date conversion error:", dateError);
          throw ApiError.badRequest(
            "Invalid date of birth format. Please use YYYY-MM-DD",
          );
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        try {
          await patientRepository.updatePatientProfile(
            req.user.userId,
            profileUpdates,
          );
        } catch (dbError: any) {
          console.error("Profile update database error:", dbError);
          throw dbError;
        }
      }

      // Get updated profile
      const updatedPatient = await patientRepository.findByUserId(
        req.user.userId,
      );

      return ok(
        res,
        {
          user: {
            id: updatedPatient!.user.id,
            phone: updatedPatient!.user.phone,
            full_name: updatedPatient!.user.full_name,
            first_name: updatedPatient!.user.first_name,
            last_name: updatedPatient!.user.last_name,
            email: updatedPatient!.user.email,
          },
          profile: {
            id: updatedPatient!.profile.id,
            date_of_birth: updatedPatient!.profile.date_of_birth,
            age: updatedPatient!.profile.age,
            gender: updatedPatient!.profile.gender,
            blood_group: updatedPatient!.profile.blood_group,
            emergency_contact_name:
              updatedPatient!.profile.emergency_contact_name,
            emergency_contact_phone:
              updatedPatient!.profile.emergency_contact_phone,
          },
        },
        "Profile updated successfully",
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/patient/appointments/:id/cancel
   * Request appointment cancellation
   */
  async cancelAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return;

      const appointmentId = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(appointmentId)) {
        throw ApiError.badRequest("Invalid appointment ID");
      }

      // Get patient profile
      const patient = await patientRepository.findByUserId(req.user.userId);
      if (!patient) {
        throw ApiError.notFound("Patient profile not found");
      }

      // Get appointment and verify it belongs to patient
      const { db } = await import("../config/db");
      const appointment = await db.oneOrNone(
        `
        SELECT a.*, p.amount as payment_amount, p.status as payment_status
        FROM appointments a
        LEFT JOIN payments p ON p.appointment_id = a.id
        WHERE a.id = $1 AND a.patient_id = $2
        `,
        [appointmentId, patient.profile.id],
      );

      if (!appointment) {
        throw ApiError.notFound("Appointment not found");
      }

      // Check if appointment can be cancelled
      if (appointment.status === "CANCELLED") {
        throw ApiError.badRequest("Appointment is already cancelled");
      }

      if (appointment.status === "COMPLETED") {
        throw ApiError.badRequest("Cannot cancel completed appointment");
      }

      if (appointment.status === "CANCELLATION_REQUESTED") {
        throw ApiError.badRequest("Cancellation already requested");
      }

      // Check if appointment is within 24 hours (commented out for testing)
      // Uncomment this in production to enforce 24-hour cancellation policy
      /*
      const appointmentTime = new Date(appointment.scheduled_start_at);
      const now = new Date();
      const hoursDifference =
        (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < 24) {
        throw ApiError.badRequest(
          "Cannot cancel appointment within 24 hours of scheduled time. Please contact support."
        );
      }
      */

      // Update appointment status to CANCELLATION_REQUESTED
      await db.none(
        `
        UPDATE appointments
        SET 
          status = 'CANCELLATION_REQUESTED',
          cancellation_reason = $1,
          cancellation_requested_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        `,
        [reason, appointmentId],
      );

      return ok(
        res,
        {
          appointmentId,
          status: "CANCELLATION_REQUESTED",
          message:
            "Cancellation request submitted successfully. Admin will review and process your refund.",
        },
        "Cancellation request submitted successfully",
      );
    } catch (err) {
      next(err);
    }
  }
}

export const patientDashboardController = new PatientDashboardController();
