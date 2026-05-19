-- Migration: Add Session Tracking to Appointments
-- Date: 2026-05-19
-- Description: Adds fields to track when clinicians start and end sessions

-- 1. Add session_started_at timestamp
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP WITH TIME ZONE;

-- 2. Add session_ended_at timestamp
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS session_ended_at TIMESTAMP WITH TIME ZONE;

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_session_started_at 
ON appointments(session_started_at) WHERE session_started_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_session_ended_at 
ON appointments(session_ended_at) WHERE session_ended_at IS NOT NULL;

-- 4. Add comments to columns
COMMENT ON COLUMN appointments.session_started_at IS 'Timestamp when clinician started the session';
COMMENT ON COLUMN appointments.session_ended_at IS 'Timestamp when clinician ended the session';

-- 5. Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name IN ('session_started_at', 'session_ended_at');

-- 6. Show sample of appointments with session tracking
SELECT 
  id,
  patient_id,
  clinician_id,
  status,
  scheduled_start_at,
  session_started_at,
  session_ended_at,
  created_at
FROM appointments
ORDER BY scheduled_start_at DESC
LIMIT 10;
