// src/types/appointment.types.ts

export type AppointmentType =
  | "IN_PERSON"
  | "ONLINE"
  | "INPATIENT_ASSESSMENT"
  | "FOLLOW_UP";

export type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "CANCELLED_BY_ADMIN"
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
  patient_notes: string | null;
  session_started_at: Date | null;
  session_ended_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ClinicianDashboardStats {
  date: string;
  total: number;
  waiting: number;
  ongoing: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface ClinicianNote {
  id: number;
  appointment_id: number;
  clinician_id: number;
  patient_id: number;
  session_notes: string;
  created_by_user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface FollowUpAppointment {
  id: number;
  parent_appointment_id: number;
  patient_id: number;
  clinician_id: number;
  follow_up_date: string;
  follow_up_notes: string | null;
  is_scheduled: boolean;
  scheduled_appointment_id: number | null;
  created_by_user_id: number;
  created_at: Date;
  updated_at: Date;
}
