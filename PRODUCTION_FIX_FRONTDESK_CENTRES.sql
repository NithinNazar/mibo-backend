-- ============================================================================
-- PRODUCTION FIX: Assign Centres to Front Desk Staff
-- ============================================================================
-- Purpose: Fix front desk staff filtering by ensuring all FRONT_DESK users
--          have a centre assigned in the user_roles table
--
-- INSTRUCTIONS:
-- 1. First, run SECTION 1 (Diagnostic) to see current state
-- 2. Review the output and identify which users need centres
-- 3. Edit SECTION 2 to add your specific user-to-centre mappings
-- 4. Run SECTION 2 to apply the fix
-- 5. Run SECTION 3 to verify everything is correct
--
-- SAFETY: This script uses UPDATE with WHERE conditions to prevent
--         overwriting existing centre assignments
-- ============================================================================

-- ============================================================================
-- SECTION 1: DIAGNOSTIC (READ-ONLY) - Run this first
-- ============================================================================

-- Show all centres available
DO $$
BEGIN
    RAISE NOTICE '=== AVAILABLE CENTRES ===';
END $$;

SELECT 
    id as centre_id,
    name as centre_name,
    city
FROM centres 
ORDER BY id;

-- Show all front desk staff and their current centre assignments
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FRONT DESK STAFF - CURRENT STATE ===';
END $$;

SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    u.phone,
    CASE 
        WHEN ur.centre_id IS NULL THEN '❌ NO CENTRE'
        ELSE '✅ HAS CENTRE'
    END as status,
    ur.centre_id as current_centre_id,
    c.name as current_centre_name,
    c.city as current_centre_city
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN centres c ON ur.centre_id = c.id
WHERE r.name = 'FRONT_DESK'
  AND u.is_active = TRUE
  AND ur.is_active = TRUE
ORDER BY ur.centre_id NULLS FIRST, u.id;

-- Count users without centres
DO $$
DECLARE
    unassigned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unassigned_count
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'FRONT_DESK'
      AND u.is_active = TRUE
      AND ur.is_active = TRUE
      AND ur.centre_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SUMMARY ===';
    RAISE NOTICE 'Front desk staff without centres: %', unassigned_count;
    
    IF unassigned_count = 0 THEN
        RAISE NOTICE '✅ All front desk staff have centres assigned!';
    ELSE
        RAISE NOTICE '⚠️  % users need centre assignment', unassigned_count;
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: FIX - Assign Centres to Front Desk Staff
-- ============================================================================
-- IMPORTANT: Edit the assignments below based on SECTION 1 output
-- Format: UPDATE for each user that needs a centre
-- ============================================================================

DO $$
DECLARE
    updated_count INTEGER := 0;
    centre_bangalore_id INTEGER;
    centre_kochi_id INTEGER;
    centre_mumbai_id INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== APPLYING FIXES ===';
    
    -- Get centre IDs (adjust city names if different in your DB)
    SELECT id INTO centre_bangalore_id FROM centres WHERE LOWER(city) = 'bangalore' LIMIT 1;
    SELECT id INTO centre_kochi_id FROM centres WHERE LOWER(city) = 'kochi' LIMIT 1;
    SELECT id INTO centre_mumbai_id FROM centres WHERE LOWER(city) = 'mumbai' LIMIT 1;
    
    RAISE NOTICE 'Centre IDs: Bangalore=%, Kochi=%, Mumbai=%', 
        centre_bangalore_id, centre_kochi_id, centre_mumbai_id;
    RAISE NOTICE '';
    
    -- ========================================================================
    -- EDIT THIS SECTION: Add your user-to-centre assignments
    -- ========================================================================
    -- Template:
    -- UPDATE user_roles
    -- SET centre_id = centre_<CITY>_id, updated_at = NOW()
    -- WHERE user_id = (SELECT id FROM users WHERE username = '<USERNAME>')
    --   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
    --   AND centre_id IS NULL;  -- Only update if not already assigned
    -- GET DIAGNOSTICS updated_count = ROW_COUNT;
    -- RAISE NOTICE 'Assigned % to <USERNAME>', 
    --     (SELECT name FROM centres WHERE id = centre_<CITY>_id);
    
    -- Example 1: Assign Kochi to user 'front999'
    UPDATE user_roles
    SET centre_id = centre_kochi_id, updated_at = NOW()
    WHERE user_id = (SELECT id FROM users WHERE username = 'front999')
      AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
      AND centre_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE '✅ Assigned Kochi to front999';
    END IF;
    
    -- Example 2: Assign Bangalore to user 'frontdesk_blr'
    -- UPDATE user_roles
    -- SET centre_id = centre_bangalore_id, updated_at = NOW()
    -- WHERE user_id = (SELECT id FROM users WHERE username = 'frontdesk_blr')
    --   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
    --   AND centre_id IS NULL;
    -- GET DIAGNOSTICS updated_count = ROW_COUNT;
    -- IF updated_count > 0 THEN
    --     RAISE NOTICE '✅ Assigned Bangalore to frontdesk_blr';
    -- END IF;
    
    -- Example 3: Assign Mumbai to user 'frontdesk_mumbai'
    -- UPDATE user_roles
    -- SET centre_id = centre_mumbai_id, updated_at = NOW()
    -- WHERE user_id = (SELECT id FROM users WHERE username = 'frontdesk_mumbai')
    --   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
    --   AND centre_id IS NULL;
    -- GET DIAGNOSTICS updated_count = ROW_COUNT;
    -- IF updated_count > 0 THEN
    --     RAISE NOTICE '✅ Assigned Mumbai to frontdesk_mumbai';
    -- END IF;
    
    -- ========================================================================
    -- ADD MORE ASSIGNMENTS ABOVE THIS LINE
    -- ========================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE 'Fix application complete!';
END $$;

-- ============================================================================
-- SECTION 3: VERIFICATION - Run this after SECTION 2
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION - AFTER FIX ===';
END $$;

-- Show all front desk staff again
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    CASE 
        WHEN ur.centre_id IS NULL THEN '❌ NO CENTRE'
        ELSE '✅ HAS CENTRE'
    END as status,
    ur.centre_id,
    c.name as centre_name,
    c.city
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN centres c ON ur.centre_id = c.id
WHERE r.name = 'FRONT_DESK'
  AND u.is_active = TRUE
  AND ur.is_active = TRUE
ORDER BY ur.centre_id NULLS FIRST, u.id;

-- Final check - should return 0 rows
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'FRONT_DESK'
      AND u.is_active = TRUE
      AND ur.is_active = TRUE
      AND ur.centre_id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL CHECK ===';
    
    IF remaining_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS! All front desk staff have centres assigned!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % users still without centres', remaining_count;
        RAISE NOTICE 'Please review SECTION 2 and add missing assignments';
    END IF;
END $$;

-- ============================================================================
-- NOTES FOR FUTURE FRONT DESK STAFF:
-- ============================================================================
-- When creating new front desk staff users, ensure you:
-- 1. Create the user in the 'users' table
-- 2. Assign FRONT_DESK role in 'user_roles' table
-- 3. SET centre_id in the 'user_roles' table (IMPORTANT!)
--
-- Example for new user:
-- INSERT INTO user_roles (user_id, role_id, centre_id, is_active, created_at, updated_at)
-- VALUES (
--     <new_user_id>,
--     (SELECT id FROM roles WHERE name = 'FRONT_DESK'),
--     <centre_id>,  -- Don't forget this!
--     TRUE,
--     NOW(),
--     NOW()
-- );
-- ============================================================================
