-- Check if Abhinand PS's profile video URL was saved
-- Run this query on your database to verify the fix worked

-- ============================================
-- QUERY 1: Find Abhinand PS (any name variation)
-- ============================================
SELECT 
  cp.id AS clinician_id,
  u.id AS user_id,
  u.full_name,
  cp.profile_video_url,
  CASE 
    WHEN cp.profile_video_url IS NULL THEN '❌ NULL - Not saved'
    WHEN cp.profile_video_url = '' THEN '❌ Empty string - Not saved'
    ELSE '✅ URL exists!'
  END AS status,
  LENGTH(cp.profile_video_url) AS url_length,
  cp.profile_picture_url,
  cp.updated_at AS last_updated,
  cp.is_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE u.full_name ILIKE '%abhinand%'
ORDER BY cp.id;

-- ============================================
-- QUERY 2: Exact name match with more details
-- ============================================
SELECT 
  cp.id AS clinician_id,
  u.id AS user_id,
  u.full_name,
  u.phone,
  u.email,
  cp.specialization,
  cp.profile_video_url,
  cp.profile_picture_url,
  cp.bio,
  cp.updated_at AS profile_last_updated,
  u.updated_at AS user_last_updated
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE u.full_name = 'Abhinand P S';

-- ============================================
-- QUERY 3: Check if column exists (verification)
-- ============================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name = 'profile_video_url';

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- If URL was saved successfully:
--   - profile_video_url should contain the YouTube URL
--   - status should show '✅ URL exists!'
--   - url_length should be > 0
--   - last_updated should be recent (within last few minutes)
--
-- If URL was NOT saved (bug still present):
--   - profile_video_url will be NULL or empty string
--   - status will show '❌ NULL - Not saved' or '❌ Empty string - Not saved'
--   - url_length will be NULL or 0
