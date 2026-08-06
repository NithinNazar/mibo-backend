-- Migration: Add gender column to clinician_profiles table
-- Date: 2026-04-20
-- Description: Add gender field to store clinician gender (MALE, FEMALE, OTHER)

-- Add gender column to clinician_profiles table
ALTER TABLE clinician_profiles 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'));

-- Add comment to explain the column
COMMENT ON COLUMN clinician_profiles.gender IS 'Gender of the clinician: MALE, FEMALE, or OTHER';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name = 'gender';
