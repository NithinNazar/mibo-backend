-- ============================================================================
-- ADD PROFILE VIDEO URL TO CLINICIAN PROFILES
-- ============================================================================
-- Purpose: Add profile_video_url column to store YouTube video URLs for clinicians
-- Date: 2026-06-25
-- ============================================================================

-- Add profile_video_url column to clinician_profiles table
ALTER TABLE clinician_profiles
ADD COLUMN IF NOT EXISTS profile_video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clinician_profiles.profile_video_url IS 'YouTube video URL for clinician profile (optional)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name = 'profile_video_url';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'profile_video_url column added successfully to clinician_profiles table' as message;
