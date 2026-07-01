-- Quick production database check - all results in one view

SELECT 
    'WHAT WILL BE DELETED' as category,
    'Patient users' as item,
    COUNT(*) as count 
FROM users WHERE user_type = 'PATIENT'

UNION ALL

SELECT 
    'WHAT WILL BE DELETED',
    'Appointments',
    COUNT(*) 
FROM appointments

UNION ALL

SELECT 
    'WHAT WILL BE DELETED',
    'Payments',
    COUNT(*) 
FROM payments

UNION ALL

SELECT 
    'WHAT WILL BE DELETED',
    'Inactive clinicians',
    COUNT(*) 
FROM clinician_profiles WHERE is_active = false

UNION ALL

SELECT 
    'WHAT WILL BE KEPT',
    'Staff users',
    COUNT(*) 
FROM users WHERE user_type = 'STAFF'

UNION ALL

SELECT 
    'WHAT WILL BE KEPT',
    'Active clinicians',
    COUNT(*) 
FROM clinician_profiles WHERE is_active = true

UNION ALL

SELECT 
    'WHAT WILL BE KEPT',
    'Availability rules',
    COUNT(*) 
FROM clinician_availability_rules

ORDER BY category DESC, item;
