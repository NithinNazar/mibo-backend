-- ============================================
-- PRODUCTION: Assign Centres to Front Desk Staff
-- SAFE VERSION - Run in pgAdmin with manual transaction control
-- ============================================

-- STEP 0: Start transaction (IMPORTANT!)
BEGIN;

-- ============================================
-- STEP 1: CHECK CURRENT STATE (READ-ONLY)
-- ============================================

-- Check all front desk staff and their current centre assignments
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    u.phone,
    r.name as role,
    ur.centre_id as current_centre_id,
    c.name as current_centre_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN centres c ON ur.centre_id = c.id
WHERE r.name = 'FRONT_DESK'
  AND u.is_active = TRUE
  AND ur.is_active = TRUE
ORDER BY u.id;

-- Check available centres
SELECT id, name, city FROM centres ORDER BY id;

-- ============================================
-- STEP 2: IDENTIFY USERS WITHOUT CENTRES
-- ============================================

-- List front desk staff who don't have a centre assigned
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    u.phone
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'FRONT_DESK'
  AND u.is_active = TRUE
  AND ur.is_active = TRUE
  AND ur.centre_id IS NULL
ORDER BY u.id;

-- ============================================
-- STEP 3: ASSIGN CENTRES
-- ============================================
-- IMPORTANT: Review STEP 1 and STEP 2 results before proceeding
-- Uncomment and modify the UPDATE statements below

-- Example: Assign Bangalore centre (ID: 1)
-- UPDATE user_roles
-- SET centre_id = 1, updated_at = NOW()
-- WHERE user_id = <USER_ID> 
--   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK');

-- Example: Assign Kochi centre (ID: 2)
-- UPDATE user_roles
-- SET centre_id = 2, updated_at = NOW()
-- WHERE user_id = <USER_ID> 
--   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK');

-- Example: Assign Mumbai centre (ID: 3)
-- UPDATE user_roles
-- SET centre_id = 3, updated_at = NOW()
-- WHERE user_id = <USER_ID> 
--   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK');

-- ============================================
-- STEP 4: VERIFY CHANGES (BEFORE COMMIT)
-- ============================================

-- Check all front desk staff again
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
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
ORDER BY u.id;

-- Check if any still don't have centres (should return 0 rows)
SELECT 
    u.id as user_id,
    u.full_name,
    u.username
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'FRONT_DESK'
  AND u.is_active = TRUE
  AND ur.is_active = TRUE
  AND ur.centre_id IS NULL;

-- ============================================
-- STEP 5: COMMIT OR ROLLBACK
-- ============================================

-- If everything looks good, COMMIT:
-- COMMIT;

-- If something is wrong, ROLLBACK:
-- ROLLBACK;

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Run STEP 1 and STEP 2 to see current state
-- 2. Note which users need centre assignments
-- 3. Uncomment and modify STEP 3 UPDATE statements
-- 4. Run STEP 3 UPDATE statements
-- 5. Run STEP 4 to verify changes
-- 6. If correct, run COMMIT
-- 7. If wrong, run ROLLBACK and start over
