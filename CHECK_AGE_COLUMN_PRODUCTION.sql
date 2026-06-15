-- Check if 'age' column exists in patient_profiles table in PRODUCTION

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
  AND column_name = 'age';

-- If the query returns 0 rows, the age column DOES NOT EXIST
-- If it returns 1 row, check the data type and constraints

-- ==================================================================

-- Also check what columns DO exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
ORDER BY ordinal_position;
