// src/repositories/appointment.repository.ts
import { db } from "../config/db";
import { Appointment, AppointmentStatus } from "../types/appointment.types";

export class AppointmentRepository {
  async createAppointment(params: {
    patient_id: number;
    clinician_id: number;
    centre_id: number;
    appointment_type: string;
    scheduled_start_at: string;
    scheduled_end_at: string;
    duration_minutes: number;
    status: AppointmentStatus;
    parent_appointment_id?: number | null;
    booked_by_user_id: number;
    source: string;
    notes?: string | null;
  }): Promise<Appointment> {
    const query = `
      INSERT INTO appointments (
        patient_id,
        clinician_id,
        centre_id,
        appointment_type,
        scheduled_start_at,
        scheduled_end_at,
        duration_minutes,
        status,
        parent_appointment_id,
        booked_by_user_id,
        source,
        notes,
        is_active
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, TRUE
      )
      RETURNING *;
    `;

    const appointment = await db.one<Appointment>(query, [
      params.patient_id,
      params.clinician_id,
      params.centre_id,
      params.appointment_type,
      params.scheduled_start_at,
      params.scheduled_end_at,
      params.duration_minutes,
      params.status,
      params.parent_appointment_id || null,
      params.booked_by_user_id,
      params.source,
      params.notes || null,
    ]);

    await this.insertStatusHistory({
      appointment_id: appointment.id,
      previous_status: null,
      new_status: appointment.status,
      changed_by_user_id: params.booked_by_user_id,
      reason: "Appointment created",
    });

    return appointment;
  }

  async insertStatusHistory(params: {
    appointment_id: number;
    previous_status: string | null;
    new_status: string;
    changed_by_user_id: number;
    reason?: string | null;
  }) {
    const query = `
      INSERT INTO appointment_status_history (
        appointment_id,
        previous_status,
        new_status,
        changed_by_user_id,
        changed_at,
        reason
      )
      VALUES ($1, $2, $3, $4, NOW(), $5);
    `;
    await db.none(query, [
      params.appointment_id,
      params.previous_status,
      params.new_status,
      params.changed_by_user_id,
      params.reason || null,
    ]);
  }

  async getAppointmentById(id: number): Promise<Appointment | null> {
    const query = `
      SELECT *
      FROM appointments
      WHERE id = $1 AND is_active = TRUE
    `;
    const appt = await db.oneOrNone<Appointment>(query, [id]);
    return appt;
  }

  async listAppointmentsForPatient(patient_id: number): Promise<Appointment[]> {
    const query = `
      SELECT *
      FROM appointments
      WHERE patient_id = $1
        AND is_active = TRUE
      ORDER BY scheduled_start_at DESC
    `;
    return db.any<Appointment>(query, [patient_id]);
  }

  async listAppointmentsForClinician(
    clinician_id: number
  ): Promise<Appointment[]> {
    const query = `
      SELECT *
      FROM appointments
      WHERE clinician_id = $1
        AND is_active = TRUE
      ORDER BY scheduled_start_at DESC
    `;
    return db.any<Appointment>(query, [clinician_id]);
  }

  async listAppointmentsForCentre(centre_id: number): Promise<Appointment[]> {
    const query = `
      SELECT *
      FROM appointments
      WHERE centre_id = $1
        AND is_active = TRUE
      ORDER BY scheduled_start_at DESC
    `;
    return db.any<Appointment>(query, [centre_id]);
  }

  async updateStatus(
    appointment_id: number,
    new_status: AppointmentStatus,
    changed_by_user_id: number,
    reason?: string
  ): Promise<Appointment> {
    const current = await this.getAppointmentById(appointment_id);
    if (!current) {
      throw new Error("Appointment not found");
    }

    const query = `
      UPDATE appointments
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const updated = await db.one<Appointment>(query, [
      new_status,
      appointment_id,
    ]);

    await this.insertStatusHistory({
      appointment_id,
      previous_status: current.status,
      new_status,
      changed_by_user_id,
      reason,
    });

    return updated;
  }

  async rescheduleAppointment(params: {
    appointment_id: number;
    scheduled_start_at: string;
    scheduled_end_at: string;
    duration_minutes: number;
    changed_by_user_id: number;
  }): Promise<Appointment> {
    const current = await this.getAppointmentById(params.appointment_id);
    if (!current) {
      throw new Error("Appointment not found");
    }

    const query = `
      UPDATE appointments
      SET scheduled_start_at = $1,
          scheduled_end_at = $2,
          duration_minutes = $3,
          status = 'RESCHEDULED',
          updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;

    const updated = await db.one<Appointment>(query, [
      params.scheduled_start_at,
      params.scheduled_end_at,
      params.duration_minutes,
      params.appointment_id,
    ]);

    await this.insertStatusHistory({
      appointment_id: params.appointment_id,
      previous_status: current.status,
      new_status: "RESCHEDULED",
      changed_by_user_id: params.changed_by_user_id,
      reason: "Appointment rescheduled",
    });

    return updated;
  }
}

export const appointmentRepository = new AppointmentRepository();
