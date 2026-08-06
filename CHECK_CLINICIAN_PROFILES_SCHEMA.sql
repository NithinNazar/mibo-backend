-- Check if gender column exists in clinician_profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
ORDER BY ordinal_position;
