// src/types/appointment.types.ts

export type AppointmentType =
  | "IN_PERSON"
  | "ONLINE"
  | "INPATIENT_ASSESSMENT"
  | "FOLLOW_UP";

export type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type AppointmentSource =
  | "WEB_PATIENT"
  | "ADMIN_FRONT_DESK"
  | "ADMIN_CARE_COORDINATOR"
  | "ADMIN_MANAGER";

export interface Appointment {
  id: number;
  patient_id: number;
  clinician_id: number;
  centre_id: number;
  appointment_type: AppointmentType;
  scheduled_start_at: Date;
  scheduled_end_at: Date;
  duration_minutes: number;
  status: AppointmentStatus;
  parent_appointment_id: number | null;
  booked_by_user_id: number;
  source: AppointmentSource;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
