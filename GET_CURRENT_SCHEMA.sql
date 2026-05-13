-- Get current database schema for registration fee feature

-- 1. Check patient_profiles table structure
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patient_profiles'
ORDER BY ordinal_position;

-- 2. Check appointments table structure
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 3. Check payments table structure
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- 4. Check if there are any existing paid appointments
SELECT 
    COUNT(*) as total_appointments,
    COUNT(DISTINCT patient_id) as unique_patients,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_appointments
FROM appointments;

-- 5. Check payment statuses
SELECT 
    status,
    COUNT(*) as count
FROM payments
GROUP BY status;
