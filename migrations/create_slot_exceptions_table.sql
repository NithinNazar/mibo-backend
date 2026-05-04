-- Migration: Create clinician_slot_exceptions table
-- Purpose: Allow blocking individual slots while keeping recurring availability rules
-- Date: 2026-05-02

CREATE TABLE IF NOT EXISTS clinician_slot_exceptions (
  id SERIAL PRIMARY KEY,
  clinician_id INTEGER NOT NULL REFERENCES clinician_profiles(id) ON DELETE CASCADE,
  centre_id INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('IN_PERSON', 'ONLINE', 'HYBRID')),
  reason VARCHAR(255), -- Optional: why this slot is blocked
  created_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure no duplicate exceptions for same slot
  UNIQUE(clinician_id, centre_id, exception_date, start_time, mode)
);

-- Index for faster lookups when generating slots
CREATE INDEX idx_slot_exceptions_clinician_date 
  ON clinician_slot_exceptions(clinician_id, exception_date);

-- Index for filtering by centre
CREATE INDEX idx_slot_exceptions_centre 
  ON clinician_slot_exceptions(centre_id);

-- Add comment
COMMENT ON TABLE clinician_slot_exceptions IS 
  'Stores exceptions to recurring availability rules - allows blocking individual slots without deleting the entire recurring rule';

COMMENT ON COLUMN clinician_slot_exceptions.exception_date IS 
  'The specific date to block (e.g., 2026-05-12 for blocking one Monday)';

COMMENT ON COLUMN clinician_slot_exceptions.reason IS 
  'Optional reason for blocking (e.g., "Clinician on leave", "Holiday", "Conference")';
