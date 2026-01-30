-- Migration: Add qualification, expertise, and languages to clinician_profiles
-- Date: 2026-01-30
-- Description: Adds missing fields needed for frontend clinician display

-- Add new columns to clinician_profiles table
ALTER TABLE clinician_profiles
ADD COLUMN IF NOT EXISTS qualification VARCHAR(500),
ADD COLUMN IF NOT EXISTS expertise JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;

-- Update existing records with default values
UPDATE clinician_profiles
SET 
  qualification = COALESCE(qualification, ''),
  expertise = COALESCE(expertise, '[]'::jsonb),
  languages = COALESCE(languages, '["English"]'::jsonb)
WHERE qualification IS NULL OR expertise IS NULL OR languages IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN clinician_profiles.qualification IS 'Educational qualifications (e.g., MBBS, MD, M.Phil)';
COMMENT ON COLUMN clinician_profiles.expertise IS 'Array of expertise areas (e.g., ["Anxiety", "Depression", "Trauma"])';
COMMENT ON COLUMN clinician_profiles.languages IS 'Array of languages spoken (e.g., ["English", "Hindi", "Malayalam"])';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name IN ('qualification', 'expertise', 'languages');
