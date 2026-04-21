-- Fix clinician profile for user_id 105 (doctor123)

-- First, let's see the current state
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    u.is_active as user_active,
    cp.id as clinician_id,
    cp.is_active as profile_active,
    r.name as role_name
FROM users u
LEFT JOIN clinician_profiles cp ON u.id = cp.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'doctor123';

-- If the clinician profile is inactive, activate it:
UPDATE clinician_profiles 
SET is_active = TRUE 
WHERE user_id = 105;

-- Verify the fix
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    u.is_active as user_active,
    cp.id as clinician_id,
    cp.is_active as profile_active
FROM users u
LEFT JOIN clinician_profiles cp ON u.id = cp.user_id
WHERE u.username = 'doctor123';
