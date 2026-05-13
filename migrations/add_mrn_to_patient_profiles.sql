-- Migration: Add MRN (Medical Record Number) to patient_profiles table
-- Date: 2026-05-09
-- Description: Adds mrn column to store unique medical record numbers for patients

-- Add mrn column to patient_profiles table
ALTER TABLE patient_profiles 
ADD COLUMN IF NOT EXISTS mrn VARCHAR(50) UNIQUE;

-- Create index on mrn for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_profiles_mrn ON patient_profiles(mrn);

-- Add comment to column
COMMENT ON COLUMN patient_profiles.mrn IS 'Medical Record Number - unique identifier for patient records';

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patient_profiles' AND column_name = 'mrn';
