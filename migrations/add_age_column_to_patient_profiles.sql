-- Migration: Add age column to patient_profiles table
-- This column stores the calculated age in years

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='patient_profiles' 
        AND column_name='age'
    ) THEN
        ALTER TABLE patient_profiles 
        ADD COLUMN age INTEGER NULL;
        
        RAISE NOTICE 'Column age added to patient_profiles table';
    ELSE
        RAISE NOTICE 'Column age already exists in patient_profiles table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
AND column_name = 'age';
