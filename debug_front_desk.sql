-- Debug Front Desk Staff Issues
-- Run these queries to check what's happening

-- 1. Check if front desk staff was created
SELECT 
  u.id,
  u.full_name,
  u.phone,
  u.email,
  u.username,
  u.password_hash,
  u.user_type,
  u.is_active
FROM users u
WHERE u.phone LIKE '987654%' OR u.username LIKE 'test%'
ORDER BY u.created_at DESC
LIMIT 5;

-- 2. Check role assignment
SELECT 
  ur.id,
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  ur.centre_id,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.role_id = 6
ORDER BY ur.created_at DESC
LIMIT 5;

-- 3. Check staff profile
SELECT 
  sp.id,
  sp.user_id,
  sp.designation,
  sp.is_active
FROM staff_profiles sp
WHERE sp.user_id IN (
  SELECT user_id FROM user_roles WHERE role_id = 6
)
ORDER BY sp.created_at DESC
LIMIT 5;

-- 4. Check centre assignment
SELECT 
  csa.id,
  csa.user_id,
  csa.centre_id,
  c.name as centre_name,
  csa.role_id,
  csa.is_active
FROM centre_staff_assignments csa
JOIN centres c ON csa.centre_id = c.id
WHERE csa.user_id IN (
  SELECT user_id FROM user_roles WHERE role_id = 6
)
ORDER BY csa.created_at DESC
LIMIT 5;

-- 5. Check if FRONT_DESK role exists
SELECT * FROM roles WHERE id = 6 OR name = 'FRONT_DESK';

-- 6. Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('username', 'password_hash', 'user_type', 'is_active')
ORDER BY ordinal_position;
