-- Debug script to check clinician login issue
-- Replace 'doctor123' with the actual username you're trying to log in with

-- 1. Check if user exists and get user details
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    u.user_type,
    u.is_active as user_is_active,
    u.password_hash IS NOT NULL as has_password
FROM users u
WHERE u.username = 'doctor123';

-- 2. Check user roles
SELECT 
    u.id as user_id,
    u.username,
    r.name as role_name,
    ur.is_active as role_is_active
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'doctor123';

-- 3. Check clinician profile
SELECT 
    u.id as user_id,
    u.username,
    cp.id as clinician_profile_id,
    cp.is_active as profile_is_active,
    cp.primary_centre_id,
    c.name as centre_name
FROM users u
LEFT JOIN clinician_profiles cp ON u.id = cp.user_id
LEFT JOIN centres c ON cp.primary_centre_id = c.id
WHERE u.username = 'doctor123';

-- 4. Full diagnostic - all related data
SELECT 
    'User Info' as section,
    u.id as user_id,
    u.username,
    u.full_name,
    u.user_type,
    u.is_active as user_is_active,
    NULL as role_name,
    NULL as clinician_id,
    NULL as profile_is_active
FROM users u
WHERE u.username = 'doctor123'

UNION ALL

SELECT 
    'User Roles' as section,
    u.id as user_id,
    u.username,
    NULL as full_name,
    NULL as user_type,
    NULL as user_is_active,
    r.name as role_name,
    NULL as clinician_id,
    ur.is_active as profile_is_active
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'doctor123'

UNION ALL

SELECT 
    'Clinician Profile' as section,
    u.id as user_id,
    u.username,
    NULL as full_name,
    NULL as user_type,
    NULL as user_is_active,
    NULL as role_name,
    cp.id as clinician_id,
    cp.is_active as profile_is_active
FROM users u
LEFT JOIN clinician_profiles cp ON u.id = cp.user_id
WHERE u.username = 'doctor123';
