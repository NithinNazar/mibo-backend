-- ============================================================================
-- ONE-TIME FIX: Assign centres to existing Front Desk staff in user_roles
-- ============================================================================
-- This script fixes the issue where front desk staff don't have centre_id
-- set in the user_roles table, causing them to see all appointments instead
-- of only their assigned centre's appointments.
--
-- SAFE FOR PGADMIN AUTO-COMMIT:
-- - Uses WHERE conditions to prevent duplicate updates
-- - Idempotent (can be run multiple times safely)
-- - Only updates FRONT_DESK role (role_id = 6)
-- ============================================================================

-- Step 1: Update user_roles.centre_id from centre_staff_assignments
-- This automatically assigns centres to front desk staff based on their
-- existing centre_staff_assignments records
UPDATE user_roles ur
SET centre_id = csa.centre_id
FROM centre_staff_assignments csa
WHERE ur.user_id = csa.user_id
  AND ur.role_id = 6  -- FRONT_DESK role only
  AND ur.centre_id IS NULL  -- Only update if not already set
  AND csa.is_active = TRUE
  AND ur.is_active = TRUE;

-- Step 2: Verify the fix - Check all front desk staff now have centres assigned
-- (This is a SELECT query, safe to run)
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    ur.role_id,
    r.name as role_name,
    ur.centre_id,
    c.name as centre_name,
    c.city as centre_city
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
LEFT JOIN centres c ON c.id = ur.centre_id
WHERE ur.role_id = 6  -- FRONT_DESK role
  AND ur.is_active = TRUE
  AND u.is_active = TRUE
ORDER BY u.full_name;

-- ============================================================================
-- EXPECTED RESULT:
-- All front desk staff should now have centre_id populated in user_roles
-- If any still show NULL centre_id, they need manual assignment
-- ============================================================================
