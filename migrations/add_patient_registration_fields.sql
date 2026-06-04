-- Migration: Add first_name, last_name, and age fields to support enhanced patient registration
-- Date: 2026-06-02
-- Description: Split full_name into first_name/last_name and add age field for better patient data collection

-- Add new columns to users table for first/last name
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Migrate existing full_name data to first_name (temporary, will be updated by users)
UPDATE users
SET first_name = full_name
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- Add age column to patient_profiles
ALTER TABLE patient_profiles
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 0 AND age <= 150);

-- Update gender enum to support new values (if using enum type)
-- Note: If gender is TEXT, no need for this. Check your schema first.
-- ALTER TYPE gender_type ADD VALUE IF NOT EXISTS 'NON_BINARY';
-- ALTER TYPE gender_type ADD VALUE IF NOT EXISTS 'PREFER_NOT_TO_SAY';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_age ON patient_profiles(age);

-- Add comment for documentation
COMMENT ON COLUMN users.first_name IS 'Patient first name (collected during registration)';
COMMENT ON COLUMN users.last_name IS 'Patient last name (collected during registration)';
COMMENT ON COLUMN patient_profiles.age IS 'Patient age in years (collected during registration, can be updated)';
