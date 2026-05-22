-- Migration: Assign centres to front desk staff users
-- Date: 2026-05-22
-- Purpose: Fix front desk staff filtering by assigning centres to users with FRONT_DESK role

-- ============================================
-- STEP 1: VERIFY CURRENT STATE (READ-ONLY)
-- ============================================

-- Check all front desk staff users and their current centre assignments
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

-- List front desk staff users who don't have a centre assigned
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    u.phone,
    r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'FRONT_DESK'
  AND u.is_active = TRUE
  AND ur.is_active = TRUE
  AND ur.centre_id IS NULL
ORDER BY u.id;

-- ============================================
-- STEP 3: ASSIGN CENTRES (MANUAL ASSIGNMENT)
-- ============================================

-- IMPORTANT: Review the output from STEP 1 and STEP 2 before running these updates
-- Uncomment and modify the appropriate UPDATE statements below based on your needs

-- Example: Assign Bangalore centre (ID: 1) to a specific user
-- UPDATE user_roles
-- SET centre_id = 1, updated_at = NOW()
-- WHERE user_id = <USER_ID> 
--   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
--   AND centre_id IS NULL;

-- Example: Assign Kochi centre (ID: 2) to a specific user
-- UPDATE user_roles
-- SET centre_id = 2, updated_at = NOW()
-- WHERE user_id = <USER_ID> 
--   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
--   AND centre_id IS NULL;

-- Example: Assign Mumbai centre (ID: 3) to a specific user
-- UPDATE user_roles
-- SET centre_id = 3, updated_at = NOW()
-- WHERE user_id = <USER_ID> 
--   AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
--   AND centre_id IS NULL;

-- ============================================
-- STEP 4: VERIFY ASSIGNMENTS
-- ============================================

-- After running the UPDATE statements, verify all front desk staff have centres assigned
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    r.name as role,
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

-- Check if any front desk staff still don't have centres (should return 0 rows)
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
-- ROLLBACK (IF NEEDED)
-- ============================================

-- If you need to rollback the changes, uncomment and run:
-- UPDATE user_roles
-- SET centre_id = NULL, updated_at = NOW()
-- WHERE role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
--   AND centre_id IS NOT NULL;
