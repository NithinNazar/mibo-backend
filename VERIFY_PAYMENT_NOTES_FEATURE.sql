-- ============================================
-- Payment Notes Feature Verification Script
-- ============================================
-- Run this script in pgAdmin to verify the payment notes feature

-- STEP 1: Check current payments table schema
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- STEP 2: Check if payment_method column exists (from previous migration)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'payments' 
  AND column_name = 'payment_method';

-- STEP 3: Check if payment_notes column exists (from new migration)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments' 
  AND column_name = 'payment_notes';

-- STEP 4: Check existing payments (latest 10)
SELECT 
    id,
    appointment_id,
    payment_method,
    payment_notes,
    amount,
    status,
    provider,
    created_at
FROM payments
ORDER BY created_at DESC
LIMIT 10;

-- STEP 5: Check if there are any direct payments (CASH/CARD/UPI)
SELECT 
    id,
    appointment_id,
    payment_method,
    payment_notes,
    amount,
    status,
    created_at
FROM payments
WHERE payment_method IN ('CASH', 'CARD', 'UPI')
ORDER BY created_at DESC;

-- STEP 6: Count payments by method
SELECT 
    payment_method,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM payments
WHERE status = 'SUCCESS'
GROUP BY payment_method
ORDER BY count DESC;

-- ============================================
-- EXPECTED RESULTS AFTER RUNNING MIGRATIONS:
-- ============================================
-- Step 1: Should show all columns including payment_method and payment_notes
-- Step 2: Should return 1 row showing payment_method column exists
-- Step 3: Should return 1 row showing payment_notes column exists
-- Step 4: Should show recent payments (payment_notes will be NULL for old records)
-- Step 5: May be empty if no direct payments yet (will have data after testing)
-- Step 6: Should show ONLINE payments, and CASH/CARD/UPI if any exist
