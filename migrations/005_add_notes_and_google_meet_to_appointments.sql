-- Add notes and Google Meet support to appointments table
-- Adds columns for clinician notes and Google Meet integration for online appointments

-- Add notes column for clinician notes
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add Google Meet link column for online appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS google_meet_link VARCHAR(500);

-- Add Google Calendar event ID column for managing meetings
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN appointments.notes IS 'Clinician notes for the appointment session';
COMMENT ON COLUMN appointments.google_meet_link IS 'Google Meet link for online appointments';
COMMENT ON COLUMN appointments.google_calendar_event_id IS 'Google Calendar event ID for managing the meeting';

-- Create index for appointments with notes (for analytics/reporting)
CREATE INDEX IF NOT EXISTS idx_appointments_with_notes 
  ON appointments(clinician_id) 
  WHERE notes IS NOT NULL;

-- Create index for online appointments with Google Meet links
CREATE INDEX IF NOT EXISTS idx_appointments_with_meet_link 
  ON appointments(id) 
  WHERE google_meet_link IS NOT NULL;
