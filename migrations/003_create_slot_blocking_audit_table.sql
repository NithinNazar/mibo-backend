-- Create slot_blocking_audit table for audit trail of slot blocking actions
-- This table maintains accountability and history of all blocking/unblocking operations

CREATE TABLE IF NOT EXISTS slot_blocking_audit (
  id SERIAL PRIMARY KEY,
  blocked_slot_id INTEGER NOT NULL REFERENCES blocked_slots(id),
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('BLOCK', 'UNBLOCK')),
  admin_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT,
  affected_appointment_ids INTEGER[],
  affected_patient_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_slot_audit_blocked_slot 
  ON slot_blocking_audit(blocked_slot_id);

CREATE INDEX IF NOT EXISTS idx_slot_audit_admin 
  ON slot_blocking_audit(admin_id);

CREATE INDEX IF NOT EXISTS idx_slot_audit_action 
  ON slot_blocking_audit(action_type);

CREATE INDEX IF NOT EXISTS idx_slot_audit_created 
  ON slot_blocking_audit(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE slot_blocking_audit IS 'Audit trail of all slot blocking and unblocking actions';
COMMENT ON COLUMN slot_blocking_audit.blocked_slot_id IS 'Reference to the blocked slot';
COMMENT ON COLUMN slot_blocking_audit.action_type IS 'Type of action performed (BLOCK or UNBLOCK)';
COMMENT ON COLUMN slot_blocking_audit.admin_id IS 'Administrator who performed the action';
COMMENT ON COLUMN slot_blocking_audit.reason IS 'Reason provided for the action';
COMMENT ON COLUMN slot_blocking_audit.affected_appointment_ids IS 'Array of appointment IDs affected by this action';
COMMENT ON COLUMN slot_blocking_audit.affected_patient_count IS 'Number of patients affected by this action';
COMMENT ON COLUMN slot_blocking_audit.metadata IS 'Additional audit data in JSON format';
COMMENT ON COLUMN slot_blocking_audit.created_at IS 'Timestamp when the action was performed';
