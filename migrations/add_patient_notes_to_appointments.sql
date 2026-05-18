-- Migration: Add patient_notes column to appointments table
-- Description: Add a separate column for patient notes (entered during booking)
--              to distinguish from clinician notes
-- Date: 2026-05-18

-- Add patient_notes column for notes entered by patient during booking
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS patient_notes TEXT;

-- Add comment to clarify the difference
COMMENT ON COLUMN appointments.notes IS 'Clinical notes entered by clinician/doctor';
COMMENT ON COLUMN appointments.patient_notes IS 'Notes entered by patient during booking (special needs, conditions, etc.)';
