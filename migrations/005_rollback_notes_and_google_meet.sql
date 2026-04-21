-- Rollback: Remove notes and Google Meet columns from appointments table
-- This script reverses the changes made in 005_add_notes_and_google_meet_to_appointments.sql

-- Drop indexes first
DROP INDEX IF EXISTS idx_appointments_with_notes;
DROP INDEX IF EXISTS idx_appointments_with_meet_link;

-- Remove columns
ALTER TABLE appointments 
  DROP COLUMN IF EXISTS notes;

ALTER TABLE appointments 
  DROP COLUMN IF EXISTS google_meet_link;

ALTER TABLE appointments 
  DROP COLUMN IF EXISTS google_calendar_event_id;
