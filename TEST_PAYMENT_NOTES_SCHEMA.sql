-- Test script to verify payment_notes column
-- Run this to check if the column exists after migration

-- Check if payment_notes column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments' 
  AND column_name = 'payment_notes';

-- If the above returns a row, the column exists
-- If it returns nothing, run the migration first
