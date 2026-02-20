// src/repositories/appointment.repository.ts
import { db } from "../config/db";
import { Appointment, AppointmentStatus } from "../types/appointment.types";

interface AppointmentFilters {
  centreId?: number;
  clinicianId?: number;
  patientId?: number;
  date?: string;
  status?: AppointmentStatus;
}

interface AppointmentWithDetails extends Appointment {
  patient_name: string;
  patient_phone: string;
  clinician_name: string;
  centre_name: string;
}

interface AvailabilityRule {
  id: number;
  clinician_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  consultation_mode: string;
  is_active: boolean;
}

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

  /**
   * Find appointments with filters
   */
  async findAppointments(
    filters: AppointmentFilters
  ): Promise<AppointmentWithDetails[]> {
    const conditions: string[] = ["a.is_active = TRUE"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.centreId) {
      conditions.push(`a.centre_id = $${paramIndex}`);
      params.push(filters.centreId);
      paramIndex++;
    }

    if (filters.clinicianId) {
      conditions.push(`a.clinician_id = $${paramIndex}`);
      params.push(filters.clinicianId);
      paramIndex++;
    }

    if (filters.patientId) {
      conditions.push(`a.patient_id = $${paramIndex}`);
      params.push(filters.patientId);
      paramIndex++;
    }

    if (filters.date) {
      conditions.push(`DATE(a.scheduled_start_at) = $${paramIndex}`);
      params.push(filters.date);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const query = `
      SELECT
        a.*,
        u_patient.full_name as patient_name,
        u_patient.phone as patient_phone,
        u_clinician.full_name as clinician_name,
        c.name as centre_name
      FROM appointments a
      JOIN patient_profiles pp ON a.patient_id = pp.id
      JOIN users u_patient ON pp.user_id = u_patient.id
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u_clinician ON cp.user_id = u_clinician.id
      JOIN centres c ON a.centre_id = c.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY a.scheduled_start_at DESC
    `;

    return db.any<AppointmentWithDetails>(query, params);
  }

  /**
   * Find appointment by ID with joins for patient, clinician, centre names
   */
  async findAppointmentById(
    id: number
  ): Promise<AppointmentWithDetails | null> {
    const query = `
      SELECT
        a.*,
        u_patient.full_name as patient_name,
        u_patient.phone as patient_phone,
        u_clinician.full_name as clinician_name,
        c.name as centre_name
      FROM appointments a
      JOIN users u_patient ON a.patient_id = u_patient.id
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u_clinician ON cp.user_id = u_clinician.id
      JOIN centres c ON a.centre_id = c.id
      WHERE a.id = $1 AND a.is_active = TRUE
    `;
    return db.oneOrNone<AppointmentWithDetails>(query, [id]);
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

  /**
   * Check for scheduling conflicts - detect overlapping appointments
   */
  async checkSchedulingConflicts(
    clinicianId: number,
    scheduledStartAt: string,
    scheduledEndAt: string,
    excludeAppointmentId?: number
  ): Promise<boolean> {
    const conditions = [
      "clinician_id = $1",
      "is_active = TRUE",
      "status NOT IN ('CANCELLED', 'NO_SHOW')",
      "((scheduled_start_at < $3 AND scheduled_end_at > $2) OR (scheduled_start_at >= $2 AND scheduled_start_at < $3))",
    ];

    const params: any[] = [clinicianId, scheduledStartAt, scheduledEndAt];

    if (excludeAppointmentId) {
      conditions.push("id != $4");
      params.push(excludeAppointmentId);
    }

    const query = `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE ${conditions.join(" AND ")}
    `;

    const result = await db.one<{ count: string }>(query, params);
    return parseInt(result.count) > 0;
  }

  /**
   * Get clinician availability rules for a specific date
   */
  async getClinicianAvailabilityRules(
    clinicianId: number,
    date: string
  ): Promise<AvailabilityRule[]> {
    // Get day of week from date (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(date).getDay();

    const query = `
      SELECT *
      FROM clinician_availability_rules
      WHERE clinician_id = $1
        AND day_of_week = $2
        AND is_active = TRUE
      ORDER BY start_time ASC
    `;

    return db.any<AvailabilityRule>(query, [clinicianId, dayOfWeek]);
  }

  /**
   * Log status change to appointment_status_history table
   */
  async logStatusChange(params: {
    appointment_id: number;
    previous_status: string | null;
    new_status: string;
    changed_by_user_id: number;
    reason?: string | null;
  }): Promise<void> {
    await this.insertStatusHistory(params);
  }
}

export const appointmentRepository = new AppointmentRepository();
