-- Add Google Meet columns to appointments table

-- Add google_meet_link column
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_meet_link VARCHAR(500);

-- Add google_meet_event_id column (for managing the calendar event)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_meet_event_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_google_meet_event_id 
ON appointments(google_meet_event_id);

-- Add comment
COMMENT ON COLUMN appointments.google_meet_link IS 'Google Meet link for online consultations';
COMMENT ON COLUMN appointments.google_meet_event_id IS 'Google Calendar event ID for managing the meeting';
