-- Check appointments table structure to understand payment tracking
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Check for payment-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%payment%';

-- Check appointments columns related to payment
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND (column_name LIKE '%payment%' OR column_name LIKE '%razorpay%' OR column_name LIKE '%transaction%');
