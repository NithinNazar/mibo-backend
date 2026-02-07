-- Migration: Update clinician_profiles for dynamic clinician management
-- Date: 2026-02-06
-- Description: Converts specialization and qualification to JSONB arrays, creates availability rules table

-- ============================================================================
-- PART 1: Update clinician_profiles table
-- ============================================================================

-- Convert specialization from VARCHAR to JSONB array
-- First, create a temporary column to store the array
ALTER TABLE clinician_profiles
ADD COLUMN IF NOT EXISTS specialization_array JSONB DEFAULT '[]'::jsonb;

-- Migrate existing specialization data to array format
UPDATE clinician_profiles
SET specialization_array = 
  CASE 
    WHEN specialization IS NOT NULL AND specialization != '' 
    THEN jsonb_build_array(specialization)
    ELSE '[]'::jsonb
  END
WHERE specialization_array = '[]'::jsonb;

-- Drop the old specialization column and rename the new one
ALTER TABLE clinician_profiles
DROP COLUMN IF EXISTS specialization CASCADE;

ALTER TABLE clinician_profiles
RENAME COLUMN specialization_array TO specialization;

-- Convert qualification from VARCHAR to JSONB array (if it exists as VARCHAR)
-- Check if qualification column exists and is VARCHAR
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinician_profiles' 
    AND column_name = 'qualification'
    AND data_type = 'character varying'
  ) THEN
    -- Create temporary column
    ALTER TABLE clinician_profiles
    ADD COLUMN IF NOT EXISTS qualification_array JSONB DEFAULT '[]'::jsonb;
    
    -- Migrate existing data
    UPDATE clinician_profiles
    SET qualification_array = 
      CASE 
        WHEN qualification IS NOT NULL AND qualification != '' 
        THEN jsonb_build_array(qualification)
        ELSE '[]'::jsonb
      END
    WHERE qualification_array = '[]'::jsonb;
    
    -- Drop old column and rename
    ALTER TABLE clinician_profiles
    DROP COLUMN qualification CASCADE;
    
    ALTER TABLE clinician_profiles
    RENAME COLUMN qualification_array TO qualification;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinician_profiles' 
    AND column_name = 'qualification'
  ) THEN
    -- Column doesn't exist, create it as JSONB
    ALTER TABLE clinician_profiles
    ADD COLUMN qualification JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Ensure expertise and languages columns exist as JSONB (they should from previous migration)
ALTER TABLE clinician_profiles
ADD COLUMN IF NOT EXISTS expertise JSONB DEFAULT '[]'::jsonb;

ALTER TABLE clinician_profiles
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;

-- Add profile_picture_url if it doesn't exist
ALTER TABLE clinician_profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN clinician_profiles.specialization IS 'Array of specializations (e.g., ["Clinical Psychologist", "Psychiatrist"])';
COMMENT ON COLUMN clinician_profiles.qualification IS 'Array of qualifications (e.g., ["MBBS", "MD", "M.Phil"])';
COMMENT ON COLUMN clinician_profiles.expertise IS 'Array of expertise areas (e.g., ["Anxiety", "Depression", "Trauma"])';
COMMENT ON COLUMN clinician_profiles.languages IS 'Array of languages spoken (e.g., ["English", "Hindi", "Malayalam"])';
COMMENT ON COLUMN clinician_profiles.profile_picture_url IS 'URL to clinician profile picture';

-- ============================================================================
-- PART 2: Create clinician_availability_rules table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinician_availability_rules (
  id BIGSERIAL PRIMARY KEY,
  clinician_id BIGINT NOT NULL REFERENCES clinician_profiles(id) ON DELETE CASCADE,
  centre_id BIGINT NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('IN_PERSON', 'ONLINE')),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinician_availability_clinician 
  ON clinician_availability_rules(clinician_id);

CREATE INDEX IF NOT EXISTS idx_clinician_availability_centre 
  ON clinician_availability_rules(centre_id);

CREATE INDEX IF NOT EXISTS idx_clinician_availability_day 
  ON clinician_availability_rules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_clinician_availability_active 
  ON clinician_availability_rules(is_active) 
  WHERE is_active = TRUE;

-- Add comment for documentation
COMMENT ON TABLE clinician_availability_rules IS 'Stores clinician availability schedules by day of week and time slots';
COMMENT ON COLUMN clinician_availability_rules.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN clinician_availability_rules.start_time IS 'Start time of availability slot';
COMMENT ON COLUMN clinician_availability_rules.end_time IS 'End time of availability slot';
COMMENT ON COLUMN clinician_availability_rules.slot_duration_minutes IS 'Duration of each appointment slot in minutes';
COMMENT ON COLUMN clinician_availability_rules.mode IS 'Consultation mode: IN_PERSON or ONLINE';

-- ============================================================================
-- PART 3: Verify the changes
-- ============================================================================

-- Verify clinician_profiles columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name IN ('specialization', 'qualification', 'expertise', 'languages', 'profile_picture_url')
ORDER BY column_name;

-- Verify clinician_availability_rules table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clinician_availability_rules'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'clinician_availability_rules';

