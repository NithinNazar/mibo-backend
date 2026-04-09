-- Create blocked_slots table for slot blocking and patient notification feature
-- This table tracks slots that have been blocked by administrators when clinicians are unavailable

CREATE TABLE IF NOT EXISTS blocked_slots (
  id SERIAL PRIMARY KEY,
  clinician_id INTEGER NOT NULL REFERENCES clinician_profiles(id),
  centre_id INTEGER NOT NULL REFERENCES centres(id),
  blocked_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT DEFAULT 'Clinician unavailable',
  blocked_by_admin_id INTEGER NOT NULL REFERENCES users(id),
  blocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  unblocked_by_admin_id INTEGER REFERENCES users(id),
  unblocked_at TIMESTAMP,
  is_blocked BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Ensure unique slot blocking per clinician, centre, date, and time
  CONSTRAINT unique_slot_blocking UNIQUE (clinician_id, centre_id, blocked_date, start_time, end_time),
  
  -- Ensure valid time range
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  
  -- Prevent blocking past slots
  CONSTRAINT no_past_blocking CHECK (blocked_date >= CURRENT_DATE)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_blocked_slots_clinician_date 
  ON blocked_slots(clinician_id, blocked_date) 
  WHERE is_blocked = TRUE;

CREATE INDEX IF NOT EXISTS idx_blocked_slots_centre 
  ON blocked_slots(centre_id) 
  WHERE is_blocked = TRUE;

CREATE INDEX IF NOT EXISTS idx_blocked_slots_date_range 
  ON blocked_slots(blocked_date) 
  WHERE is_blocked = TRUE;

CREATE INDEX IF NOT EXISTS idx_blocked_slots_admin 
  ON blocked_slots(blocked_by_admin_id);

-- Add comments for documentation
COMMENT ON TABLE blocked_slots IS 'Tracks appointment slots that have been blocked by administrators';
COMMENT ON COLUMN blocked_slots.clinician_id IS 'Reference to the clinician whose slot is blocked';
COMMENT ON COLUMN blocked_slots.centre_id IS 'Reference to the centre where the slot is located';
COMMENT ON COLUMN blocked_slots.blocked_date IS 'Date of the blocked slot';
COMMENT ON COLUMN blocked_slots.start_time IS 'Start time of the blocked slot';
COMMENT ON COLUMN blocked_slots.end_time IS 'End time of the blocked slot';
COMMENT ON COLUMN blocked_slots.reason IS 'Reason for blocking the slot (shown to patients)';
COMMENT ON COLUMN blocked_slots.blocked_by_admin_id IS 'Administrator who blocked the slot';
COMMENT ON COLUMN blocked_slots.blocked_at IS 'Timestamp when the slot was blocked';
COMMENT ON COLUMN blocked_slots.unblocked_by_admin_id IS 'Administrator who unblocked the slot (if applicable)';
COMMENT ON COLUMN blocked_slots.unblocked_at IS 'Timestamp when the slot was unblocked (if applicable)';
COMMENT ON COLUMN blocked_slots.is_blocked IS 'Current blocking status (true = blocked, false = unblocked)';
