// src/services/slot-blocking.service.ts
import { slotRepository } from "../repositories/slot.repository";
import { appointmentRepository } from "../repositories/appointment.repository";
import { auditRepository } from "../repositories/audit.repository";
import logger from "../config/logger";
import {
  BlockedSlot,
  BlockSlotRequest,
  BlockResult,
  AffectedPatient,
  BlockedSlotFilters,
} from "../types/slot-blocking.types";
import { db } from "../config/db";

class SlotBlockingService {
  /**
   * Block a single slot
   * Validates, blocks slot, cancels appointments, creates notifications, logs audit
   */
  async blockSlot(
    clinicianId: number,
    centreId: number,
    date: string,
    startTime: string,
    endTime: string,
    adminId: number,
    reason?: string,
  ): Promise<{
    blockedSlot: BlockedSlot;
    affectedPatients: AffectedPatient[];
  }> {
    try {
      // Validate slot is not in the past
      const slotDateTime = new Date(`${date}T${startTime}`);
      const now = new Date();

      if (slotDateTime < now) {
        throw new Error("PAST_SLOT_BLOCKING");
      }

      // Validate time range
      if (startTime >= endTime) {
        throw new Error("INVALID_TIME_RANGE");
      }

      // Use database transaction for atomicity
      return await db.tx(async (t) => {
        // Block the slot
        const blockedSlot = await slotRepository.blockSlot(
          clinicianId,
          centreId,
          date,
          startTime,
          endTime,
          adminId,
          reason || "Clinician unavailable",
        );

        logger.info(
          `✅ Slot blocked: ID ${blockedSlot.id} for clinician ${clinicianId} on ${date} ${startTime}-${endTime}`,
        );

        // Find affected appointments
        const affectedPatients = await this.getAffectedPatientsForSlot(
          clinicianId,
          centreId,
          date,
          startTime,
          endTime,
        );

        // Cancel affected appointments and create notifications
        const affectedAppointmentIds: number[] = [];

        for (const patient of affectedPatients) {
          // Cancel appointment
          await appointmentRepository.updateStatus(
            patient.appointment_id,
            "CANCELLED_BY_ADMIN",
            adminId,
            reason || "Clinician unavailable",
          );

          // Update appointment with blocked_slot_id and refund eligibility
          await this.updateAppointmentForBlocking(
            patient.appointment_id,
            blockedSlot.id,
            patient.payment_status === "COMPLETED",
          );

          affectedAppointmentIds.push(patient.appointment_id);

          // Create notification (will be implemented in notification service)
          await this.createBlockingNotification(
            patient,
            blockedSlot,
            reason || "Clinician unavailable",
          );

          logger.info(
            `✅ Appointment ${patient.appointment_id} cancelled and patient ${patient.patient_id} notified`,
          );
        }

        // Log audit entry
        await auditRepository.logSlotAction({
          blocked_slot_id: blockedSlot.id,
          action_type: "BLOCK",
          admin_id: adminId,
          reason: reason || "Clinician unavailable",
          affected_appointment_ids: affectedAppointmentIds,
          affected_patient_count: affectedPatients.length,
        });

        logger.info(
          `✅ Audit log created for slot blocking: ${affectedPatients.length} patients affected`,
        );

        return {
          blockedSlot,
          affectedPatients,
        };
      });
    } catch (error: any) {
      logger.error("Error blocking slot:", error);
      throw error;
    }
  }

  /**
   * Block multiple slots at once
   * Handles partial failures gracefully
   */
  async blockMultipleSlots(
    slots: BlockSlotRequest[],
    adminId: number,
    reason?: string,
  ): Promise<BlockResult> {
    const result: BlockResult = {
      success: true,
      blocked_count: 0,
      failed_count: 0,
      blocked_slot_ids: [],
      failed_slots: [],
      affected_patients: [],
    };

    for (const slot of slots) {
      try {
        const { blockedSlot, affectedPatients } = await this.blockSlot(
          slot.clinician_id,
          slot.centre_id,
          slot.date,
          slot.start_time,
          slot.end_time,
          adminId,
          reason || slot.reason,
        );

        result.blocked_count++;
        result.blocked_slot_ids.push(blockedSlot.id);
        result.affected_patients.push(...affectedPatients);
      } catch (error: any) {
        result.failed_count++;
        result.failed_slots.push({
          slot,
          error: error.message || "Unknown error",
        });
        logger.error(`Failed to block slot:`, error);
      }
    }

    result.success = result.failed_count === 0;

    logger.info(
      `✅ Bulk blocking complete: ${result.blocked_count} succeeded, ${result.failed_count} failed`,
    );

    return result;
  }

  /**
   * Block all slots for a clinician on a specific day
   */
  async blockClinicianDay(
    clinicianId: number,
    centreId: number,
    date: string,
    adminId: number,
    reason?: string,
  ): Promise<BlockResult> {
    try {
      // Get all slots for the clinician on this date
      const slots = await slotRepository.findSlotsByClinicianAndDate(
        clinicianId,
        date,
      );

      if (slots.length === 0) {
        throw new Error("No slots found for this clinician on this date");
      }

      // Convert to BlockSlotRequest format
      const slotRequests: BlockSlotRequest[] = slots.map((slot) => ({
        clinician_id: clinicianId,
        centre_id: centreId,
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason,
      }));

      // Block all slots
      const result = await this.blockMultipleSlots(
        slotRequests,
        adminId,
        reason,
      );

      logger.info(
        `✅ Day blocking complete for clinician ${clinicianId} on ${date}: ${result.blocked_count} slots blocked`,
      );

      return result;
    } catch (error: any) {
      logger.error("Error blocking clinician day:", error);
      throw error;
    }
  }

  /**
   * Unblock a slot
   */
  async unblockSlot(slotId: number, adminId: number): Promise<void> {
    try {
      // Verify slot exists and is blocked
      const slot = await slotRepository.findSlotById(slotId);
      if (!slot) {
        throw new Error("SLOT_NOT_FOUND");
      }

      if (!slot.is_blocked) {
        throw new Error("SLOT_NOT_BLOCKED");
      }

      // Unblock the slot
      await slotRepository.unblockSlot(slotId, adminId);

      // Log audit entry
      await auditRepository.logSlotAction({
        blocked_slot_id: slotId,
        action_type: "UNBLOCK",
        admin_id: adminId,
        affected_appointment_ids: [],
        affected_patient_count: 0,
      });

      logger.info(`✅ Slot unblocked: ID ${slotId}`);
    } catch (error: any) {
      logger.error("Error unblocking slot:", error);
      throw error;
    }
  }

  /**
   * Get affected patients for a specific slot
   */
  private async getAffectedPatientsForSlot(
    clinicianId: number,
    centreId: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<AffectedPatient[]> {
    const query = `
      SELECT
        a.id as appointment_id,
        a.patient_id,
        u_patient.full_name as patient_name,
        u_patient.phone as patient_phone,
        u_patient.email as patient_email,
        a.scheduled_start_at as appointment_time,
        u_clinician.full_name as clinician_name,
        p.status as payment_status,
        CASE
          WHEN p.status = 'COMPLETED' THEN TRUE
          ELSE FALSE
        END as refund_eligible
      FROM appointments a
      JOIN patient_profiles pp ON a.patient_id = pp.id
      JOIN users u_patient ON pp.user_id = u_patient.id
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u_clinician ON cp.user_id = u_clinician.id
      LEFT JOIN payments p ON a.id = p.appointment_id
      WHERE a.clinician_id = $1
        AND a.centre_id = $2
        AND DATE(a.scheduled_start_at AT TIME ZONE 'UTC') = $3
        AND (a.scheduled_start_at AT TIME ZONE 'UTC')::time >= $4
        AND (a.scheduled_start_at AT TIME ZONE 'UTC')::time < $5
        AND a.status IN ('BOOKED', 'CONFIRMED', 'RESCHEDULED')
        AND a.is_active = TRUE
    `;

    return db.any<AffectedPatient>(query, [
      clinicianId,
      centreId,
      date,
      startTime,
      endTime,
    ]);
  }

  /**
   * Get affected patients for multiple slots (preview before blocking)
   */
  async getAffectedPatients(
    slots: BlockSlotRequest[],
  ): Promise<AffectedPatient[]> {
    const allAffectedPatients: AffectedPatient[] = [];

    for (const slot of slots) {
      const patients = await this.getAffectedPatientsForSlot(
        slot.clinician_id,
        slot.centre_id,
        slot.date,
        slot.start_time,
        slot.end_time,
      );
      allAffectedPatients.push(...patients);
    }

    return allAffectedPatients;
  }

  /**
   * Get blocked slots with filters
   */
  async getBlockedSlots(filters: BlockedSlotFilters): Promise<any[]> {
    try {
      const blockedSlots = await slotRepository.findBlockedSlots(filters);
      return blockedSlots;
    } catch (error: any) {
      logger.error("Error getting blocked slots:", error);
      throw error;
    }
  }

  /**
   * Update appointment with blocked_slot_id and refund eligibility
   */
  private async updateAppointmentForBlocking(
    appointmentId: number,
    blockedSlotId: number,
    refundEligible: boolean,
  ): Promise<void> {
    const query = `
      UPDATE appointments
      SET blocked_slot_id = $1,
          refund_eligible = $2,
          refund_status = CASE
            WHEN $2 = TRUE THEN 'PENDING'
            ELSE 'NOT_APPLICABLE'
          END,
          updated_at = NOW()
      WHERE id = $3
    `;

    await db.none(query, [blockedSlotId, refundEligible, appointmentId]);
  }

  /**
   * Create notification for blocked appointment
   * This will be enhanced when notification service is implemented
   */
  private async createBlockingNotification(
    patient: AffectedPatient,
    blockedSlot: BlockedSlot,
    reason: string,
  ): Promise<void> {
    // Import notification service dynamically to avoid circular dependency
    const { notificationService } = await import("./notification.service");

    await notificationService.createBlockingNotification(
      patient,
      blockedSlot,
      reason,
    );
  }
}

export const slotBlockingService = new SlotBlockingService();
