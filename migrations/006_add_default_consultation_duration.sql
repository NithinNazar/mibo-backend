-- Add default_consultation_duration_minutes to clinician_profiles table
-- This field stores the default session duration configured for each clinician in the admin panel

ALTER TABLE clinician_profiles
  ADD COLUMN IF NOT EXISTS default_consultation_duration_minutes INTEGER DEFAULT 50;

-- Add comment for documentation
COMMENT ON COLUMN clinician_profiles.default_consultation_duration_minutes IS 'Default consultation duration in minutes for this clinician (configured in admin panel)';

-- Create index for queries filtering by duration
CREATE INDEX IF NOT EXISTS idx_clinician_profiles_duration 
  ON clinician_profiles(default_consultation_duration_minutes);
