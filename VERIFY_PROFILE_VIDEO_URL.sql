-- Verification Query for Profile Video URL Feature
-- Run this on production database after deploying the fix

-- 1. Check if profile_video_url column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name = 'profile_video_url';

-- Expected: 1 row showing TEXT column

-- 2. Check current profile video URLs (before fix deployment)
SELECT 
  cp.id AS clinician_id,
  u.full_name,
  cp.profile_video_url,
  cp.updated_at
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
ORDER BY cp.id;

-- 3. After adding a video URL via admin panel, verify it saved:
-- (Replace <clinician_id> with actual ID)
SELECT 
  cp.id,
  u.full_name,
  cp.profile_video_url,
  cp.updated_at
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE cp.id = <clinician_id>;

-- Expected: Should show the URL you just added

-- 4. Check all clinicians with profile video URLs
SELECT 
  cp.id,
  u.full_name,
  cp.profile_video_url,
  LENGTH(cp.profile_video_url) AS url_length,
  cp.updated_at
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE cp.profile_video_url IS NOT NULL 
  AND cp.profile_video_url != ''
ORDER BY cp.updated_at DESC;

-- 5. Test update: Update a clinician's video URL directly (for testing)
-- (Replace <clinician_id> and <new_url> with actual values)
-- UPDATE clinician_profiles
-- SET profile_video_url = '<new_url>',
--     updated_at = NOW()
-- WHERE id = <clinician_id>;

-- 6. Verify the update worked
-- SELECT id, profile_video_url, updated_at
-- FROM clinician_profiles
-- WHERE id = <clinician_id>;
