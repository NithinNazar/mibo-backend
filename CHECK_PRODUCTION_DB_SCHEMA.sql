-- ==================================================================
-- CHECK IF date_of_birth COLUMN EXISTS IN PRODUCTION DATABASE
-- ==================================================================

-- Query 1: Check if date_of_birth column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
  AND column_name = 'date_of_birth';

-- If the above query returns 0 rows, the column DOES NOT EXIST
-- If it returns 1 row, the column EXISTS

-- ==================================================================

-- Query 2: Show ALL columns in patient_profiles table (for verification)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
ORDER BY ordinal_position;

-- ==================================================================
-- IF date_of_birth COLUMN DOES NOT EXIST, RUN THIS MIGRATION:
-- ==================================================================

-- ONLY RUN THIS IF THE COLUMN DOESN'T EXIST:
-- ALTER TABLE patient_profiles ADD COLUMN date_of_birth DATE NULL;

-- ==================================================================
