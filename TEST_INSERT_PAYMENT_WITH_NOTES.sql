-- ============================================
-- Test Script: Insert Direct Payment with Notes
-- ============================================
-- This simulates what the backend does when confirming a direct payment

-- IMPORTANT: Only run this AFTER running both migrations:
-- 1. add_payment_method_to_payments.sql
-- 2. add_payment_notes_to_payments.sql

-- Test INSERT with payment notes
-- Replace the appointment_id and patient_id with actual values from your database
BEGIN;

-- Check if we have an appointment to test with
SELECT 
    id as appointment_id,
    patient_id,
    clinician_id,
    status
FROM appointments
WHERE status IN ('BOOKED', 'CONFIRMED')
ORDER BY created_at DESC
LIMIT 1;

-- Example INSERT (uncomment and modify with actual IDs to test)
/*
INSERT INTO payments (
    patient_id, 
    appointment_id, 
    provider, 
    order_id, 
    payment_id,
    amount, 
    currency, 
    status, 
    payment_method,
    consultation_fee, 
    registration_fee, 
    payment_notes,
    paid_at, 
    created_at, 
    updated_at
) VALUES (
    1,  -- Replace with actual patient_id
    1,  -- Replace with actual appointment_id
    'DIRECT', 
    'direct_test_' || EXTRACT(EPOCH FROM NOW())::TEXT, 
    'cash_test_1',
    600, 
    'INR', 
    'SUCCESS', 
    'CASH',
    500, 
    100, 
    'Test payment note - Patient paid cash at front desk. Receipt #12345',
    NOW(), 
    NOW(), 
    NOW()
)
RETURNING *;
*/

-- Verify the insert (uncomment after running INSERT)
/*
SELECT 
    id,
    appointment_id,
    payment_method,
    payment_notes,
    amount,
    status,
    created_at
FROM payments
WHERE provider = 'DIRECT'
ORDER BY created_at DESC
LIMIT 1;
*/

ROLLBACK;  -- Change to COMMIT if you want to keep the test data

-- ============================================
-- To actually test:
-- 1. Remove the BEGIN/ROLLBACK and comment markers
-- 2. Replace patient_id and appointment_id with real values
-- 3. Run the INSERT
-- 4. Verify the payment_notes field was stored correctly
-- ============================================
