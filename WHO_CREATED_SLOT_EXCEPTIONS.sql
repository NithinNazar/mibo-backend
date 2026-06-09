-- Find out WHO created the slot exceptions in the old system
-- This will tell us if they were created by admins or if there's another source

-- Check who created the exceptions
SELECT 
    cse.id,
    cse.clinician_id,
    cp_clinician.user_id as clinician_user_id,
    u_clinician.full_name as clinician_name,
    cse.exception_date,
    cse.start_time,
    cse.end_time,
    cse.mode,
    cse.reason,
    cse.created_by_user_id,
    u_creator.full_name as created_by_name,
    u_creator.username as created_by_username,
    u_creator.user_type as creator_user_type,
    cse.created_at
FROM clinician_slot_exceptions cse
JOIN clinician_profiles cp_clinician ON cse.clinician_id = cp_clinician.id
JOIN users u_clinician ON cp_clinician.user_id = u_clinician.id
LEFT JOIN users u_creator ON cse.created_by_user_id = u_creator.id
WHERE cse.exception_date >= CURRENT_DATE
ORDER BY cse.created_at DESC
LIMIT 20;

-- Summary: Who created how many exceptions?
SELECT 
    COALESCE(u.full_name, 'NULL/Unknown') as created_by,
    COALESCE(u.user_type, 'NULL/Unknown') as user_type,
    COUNT(*) as exception_count
FROM clinician_slot_exceptions cse
LEFT JOIN users u ON cse.created_by_user_id = u.id
WHERE cse.exception_date >= CURRENT_DATE
GROUP BY u.full_name, u.user_type
ORDER BY exception_count DESC;
