// src/types/slot-blocking.types.ts
// Types and interfaces for slot blocking and patient notification feature

export interface BlockedSlot {
  id: number;
  clinician_id: number;
  centre_id: number;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  blocked_by_admin_id: number;
  blocked_at: Date;
  unblocked_by_admin_id: number | null;
  unblocked_at: Date | null;
  is_blocked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BlockSlotRequest {
  clinician_id: number;
  centre_id: number;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export interface BlockMultipleSlotsRequest {
  slots: BlockSlotRequest[];
  reason?: string;
}

export interface BlockClinicianDayRequest {
  clinician_id: number;
  centre_id: number;
  date: string;
  reason?: string;
}

export interface BlockResult {
  success: boolean;
  blocked_count: number;
  failed_count: number;
  blocked_slot_ids: number[];
  failed_slots: Array<{
    slot: BlockSlotRequest;
    error: string;
  }>;
  affected_patients: AffectedPatient[];
}

export interface AffectedPatient {
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  appointment_id: number;
  appointment_time: string;
  clinician_name: string;
  payment_status: string | null;
  refund_eligible: boolean;
}

export interface PatientNotification {
  id: number;
  patient_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  appointment_id: number | null;
  blocked_slot_id: number | null;
  metadata: Record<string, any> | null;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type NotificationType =
  | "APPOINTMENT_BLOCKED"
  | "APPOINTMENT_CANCELLED"
  | "REFUND_INITIATED"
  | "GENERAL";

export interface SlotAuditData {
  blocked_slot_id: number;
  action_type: "BLOCK" | "UNBLOCK";
  admin_id: number;
  reason?: string;
  affected_appointment_ids: number[];
  affected_patient_count: number;
  metadata?: Record<string, any>;
}

export interface BlockedSlotFilters {
  clinician_id?: number;
  centre_id?: number;
  date_from?: string;
  date_to?: string;
  is_blocked?: boolean;
  blocked_by_admin_id?: number;
}

export interface NotificationFilters {
  unread_only?: boolean;
  date_from?: string;
  date_to?: string;
  notification_type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface CreateNotificationData {
  patient_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  appointment_id?: number;
  blocked_slot_id?: number;
  metadata?: Record<string, any>;
}

export interface AuditFilters {
  action_type?: "BLOCK" | "UNBLOCK";
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
