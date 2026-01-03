// src/repositories/booking.repository.ts
import { db } from "../config/db";

export interface Appointment {
  id: number;
  patient_id: number;
  clinician_id: number;
  centre_id: number;
  appointment_type: string;
  scheduled_start_at: Date;
  scheduled_end_at: Date;
  duration_minutes: number;
  status: string;
  booked_by_user_id: number;
  source: string;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ClinicianProfile {
  id: number;
  user_id: number;
  primary_centre_id: number;
  specialization: string;
  registration_number: string;
  years_of_experience: number;
  bio: string;
  consultation_modes: any;
  default_consultation_duration_minutes: number;
  consultation_fee: number;
  is_active: boolean;
}

export interface Centre {
  id: number;
  name: string;
  city: string;
  address_line1: string;
  address_line2: string;
  pincode: string;
  contact_phone: string;
  timezone: string;
  is_active: boolean;
}

class BookingRepository {
  /**
   * Find clinician by ID
   */
  async findClinicianById(
    clinicianId: number
  ): Promise<ClinicianProfile | null> {
    return await db.oneOrNone(
      `SELECT cp.*, u.full_name as clinician_name
       FROM clinician_profiles cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.id = $1 AND cp.is_active = true`,
      [clinicianId]
    );
  }

  /**
   * Find centre by ID
   */
  async findCentreById(centreId: number): Promise<Centre | null> {
    return await db.oneOrNone(
      "SELECT * FROM centres WHERE id = $1 AND is_active = true",
      [centreId]
    );
  }

  /**
   * Check if time slot is available
   */
  async isTimeSlotAvailable(
    clinicianId: number,
    centreId: number,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const conflictingAppointments = await db.oneOrNone(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE clinician_id = $1
       AND centre_id = $2
       AND status NOT IN ('CANCELLED', 'NO_SHOW')
       AND (
         (scheduled_start_at <= $3 AND scheduled_end_at > $3)
         OR (scheduled_start_at < $4 AND scheduled_end_at >= $4)
         OR (scheduled_start_at >= $3 AND scheduled_end_at <= $4)
       )`,
      [clinicianId, centreId, startTime, endTime]
    );

    return parseInt(conflictingAppointments.count) === 0;
  }

  /**
   * Create appointment
   */
  async createAppointment(data: {
    patientId: number;
    clinicianId: number;
    centreId: number;
    appointmentType: string;
    scheduledStartAt: Date;
    scheduledEndAt: Date;
    durationMinutes: number;
    bookedByUserId: number;
    source: string;
    notes?: string;
  }): Promise<Appointment> {
    return await db.one(
      `INSERT INTO appointments (
        patient_id, clinician_id, centre_id, appointment_type,
        scheduled_start_at, scheduled_end_at, duration_minutes,
        status, booked_by_user_id, source, notes, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'BOOKED', $8, $9, $10, true)
      RETURNING *`,
      [
        data.patientId,
        data.clinicianId,
        data.centreId,
        data.appointmentType,
        data.scheduledStartAt,
        data.scheduledEndAt,
        data.durationMinutes,
        data.bookedByUserId,
        data.source,
        data.notes || null,
      ]
    );
  }

  /**
   * Get appointment by ID
   */
  async findAppointmentById(appointmentId: number): Promise<any | null> {
    return await db.oneOrNone(
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
      [appointmentId]
    );
  }

  /**
   * Get appointment by ID with patient ID verification
   */
  async findAppointmentByIdAndPatient(
    appointmentId: number,
    patientId: number
  ): Promise<any | null> {
    return await db.oneOrNone(
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
        c.contact_phone
      FROM appointments a
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON a.centre_id = c.id
      WHERE a.id = $1 AND a.patient_id = $2`,
      [appointmentId, patientId]
    );
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    appointmentId: number,
    status: string
  ): Promise<Appointment> {
    return await db.one(
      `UPDATE appointments 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, appointmentId]
    );
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(
    patientId: number,
    filters?: {
      status?: string;
      upcoming?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    let query = `
      SELECT 
        a.*,
        u.full_name as clinician_name,
        cp.specialization,
        cp.consultation_fee,
        c.name as centre_name,
        c.address_line1,
        c.city,
        p.status as payment_status,
        p.amount as payment_amount,
        vs.join_url as meet_link
      FROM appointments a
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON a.centre_id = c.id
      LEFT JOIN payments p ON a.id = p.appointment_id
      LEFT JOIN video_sessions vs ON a.id = vs.appointment_id
      WHERE a.patient_id = $1
    `;

    const params: any[] = [patientId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.upcoming) {
      query += ` AND a.scheduled_start_at > NOW()`;
    }

    query += ` ORDER BY a.scheduled_start_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    return await db.any(query, params);
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: number,
    reason?: string
  ): Promise<Appointment> {
    return await db.one(
      `UPDATE appointments 
       SET status = 'CANCELLED', notes = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason || null, appointmentId]
    );
  }

  /**
   * Get upcoming appointments count for patient
   */
  async getUpcomingAppointmentsCount(patientId: number): Promise<number> {
    const result = await db.one(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE patient_id = $1
       AND scheduled_start_at > NOW()
       AND status NOT IN ('CANCELLED', 'NO_SHOW')`,
      [patientId]
    );

    return parseInt(result.count);
  }
}

export const bookingRepository = new BookingRepository();
