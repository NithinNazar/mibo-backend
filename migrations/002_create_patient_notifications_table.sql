-- Create patient_notifications table for patient dashboard notifications
-- This table stores notifications sent to patients about appointment changes

CREATE TABLE IF NOT EXISTS patient_notifications (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient_profiles(id),
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  appointment_id INTEGER REFERENCES appointments(id),
  blocked_slot_id INTEGER REFERENCES blocked_slots(id),
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_patient_notifications_patient 
  ON patient_notifications(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_notifications_unread 
  ON patient_notifications(patient_id) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_patient_notifications_type 
  ON patient_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_patient_notifications_appointment 
  ON patient_notifications(appointment_id);

-- Add comments for documentation
COMMENT ON TABLE patient_notifications IS 'Stores notifications displayed to patients on their dashboard';
COMMENT ON COLUMN patient_notifications.patient_id IS 'Reference to the patient receiving the notification';
COMMENT ON COLUMN patient_notifications.notification_type IS 'Type of notification (APPOINTMENT_BLOCKED, APPOINTMENT_CANCELLED, REFUND_INITIATED, GENERAL)';
COMMENT ON COLUMN patient_notifications.title IS 'Notification title displayed to patient';
COMMENT ON COLUMN patient_notifications.message IS 'Full notification message with details';
COMMENT ON COLUMN patient_notifications.appointment_id IS 'Reference to related appointment (if applicable)';
COMMENT ON COLUMN patient_notifications.blocked_slot_id IS 'Reference to blocked slot that triggered notification (if applicable)';
COMMENT ON COLUMN patient_notifications.metadata IS 'Additional notification data in JSON format';
COMMENT ON COLUMN patient_notifications.is_read IS 'Whether patient has viewed the notification';
COMMENT ON COLUMN patient_notifications.read_at IS 'Timestamp when notification was marked as read';
