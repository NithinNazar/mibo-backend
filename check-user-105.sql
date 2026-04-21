-- Quick diagnostic for user_id 105 (doctor123)

-- Check user details
SELECT 'USER DETAILS' as info;
SELECT id, username, full_name, user_type, is_active 
FROM users 
WHERE id = 105;

-- Check user roles
SELECT 'USER ROLES' as info;
SELECT r.name as role_name, ur.is_active as role_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 105;

-- Check clinician profile
SELECT 'CLINICIAN PROFILE' as info;
SELECT id, user_id, is_active, primary_centre_id
FROM clinician_profiles
WHERE user_id = 105;

-- If clinician profile is inactive, activate it
-- Uncomment the line below to fix:
-- UPDATE clinician_profiles SET is_active = TRUE WHERE user_id = 105;
