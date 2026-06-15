-- =====================================================================
-- Migration: Add first_name and last_name columns to users table
-- =====================================================================
-- This migration adds separate first_name and last_name columns
-- to support the new enhanced user registration flow
-- =====================================================================

-- Step 1: Add columns if they don't exist
DO $$ 
BEGIN
    -- Add first_name column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' 
        AND column_name='first_name'
    ) THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NULL;
        RAISE NOTICE 'Column first_name added to users table';
    ELSE
        RAISE NOTICE 'Column first_name already exists';
    END IF;

    -- Add last_name column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' 
        AND column_name='last_name'
    ) THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(100) NULL;
        RAISE NOTICE 'Column last_name added to users table';
    ELSE
        RAISE NOTICE 'Column last_name already exists';
    END IF;
END $$;

-- Step 2: Populate first_name and last_name from existing full_name
-- This helps migrate existing users with only full_name
UPDATE users 
SET 
    first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = CASE 
        WHEN array_length(string_to_array(full_name, ' '), 1) > 1 
        THEN substring(full_name from length(SPLIT_PART(full_name, ' ', 1)) + 2)
        ELSE SPLIT_PART(full_name, ' ', 1)
    END
WHERE 
    (first_name IS NULL OR last_name IS NULL)
    AND full_name IS NOT NULL
    AND full_name != '';

-- Step 3: Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('first_name', 'last_name', 'full_name')
ORDER BY column_name;

-- Step 4: Show sample data to verify migration
SELECT 
    id,
    phone,
    first_name,
    last_name,
    full_name,
    email
FROM users
LIMIT 5;
