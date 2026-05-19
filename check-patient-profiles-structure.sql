-- Check patient_profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
ORDER BY ordinal_position;

-- Check if full_name and phone are in patient_profiles or users table
SELECT 
  'patient_profiles columns' as table_name,
  column_name
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
AND column_name IN ('full_name', 'phone', 'user_id', 'id');

SELECT 
  'users columns' as table_name,
  column_name
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('full_name', 'phone', 'id');

-- Sample data from patient_profiles
SELECT * FROM patient_profiles LIMIT 3;

-- Sample data from users (patients only)
SELECT id, full_name, phone, user_type 
FROM users 
WHERE user_type = 'PATIENT' 
LIMIT 3;
