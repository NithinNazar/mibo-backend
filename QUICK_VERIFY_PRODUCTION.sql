-- Quick verification after production cleanup

SELECT 
    'DELETED (MUST BE 0)' as status,
    'Patient users' as item,
    COUNT(*) as count 
FROM users WHERE user_type = 'PATIENT'

UNION ALL

SELECT 
    'DELETED (MUST BE 0)',
    'Appointments',
    COUNT(*) 
FROM appointments

UNION ALL

SELECT 
    'DELETED (MUST BE 0)',
    'Payments',
    COUNT(*) 
FROM payments

UNION ALL

SELECT 
    'DELETED (MUST BE 0)',
    'Patient profiles',
    COUNT(*) 
FROM patient_profiles

UNION ALL

SELECT 
    'DELETED (MUST BE 0)',
    'Inactive clinicians',
    COUNT(*) 
FROM clinician_profiles WHERE is_active = false

UNION ALL

SELECT 
    'DELETED (MUST BE 0)',
    'Blocked slots',
    COUNT(*) 
FROM blocked_slots

UNION ALL

SELECT 
    'PRESERVED (MUST HAVE COUNT)',
    'Staff users',
    COUNT(*) 
FROM users WHERE user_type = 'STAFF'

UNION ALL

SELECT 
    'PRESERVED (MUST HAVE COUNT)',
    'Active clinicians',
    COUNT(*) 
FROM clinician_profiles WHERE is_active = true

UNION ALL

SELECT 
    'PRESERVED (MUST HAVE COUNT)',
    'Availability rules',
    COUNT(*) 
FROM clinician_availability_rules

ORDER BY status DESC, item;
