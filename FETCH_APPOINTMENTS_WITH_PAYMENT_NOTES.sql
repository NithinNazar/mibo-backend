-- ============================================
-- Fetch Appointments with Payment Notes
-- ============================================
-- This query shows how to retrieve payment notes for appointments
-- Similar to what the admin panel will need to display

-- Get appointments with payment information including notes
SELECT 
    a.id as appointment_id,
    a.status as appointment_status,
    a.appointment_type,
    a.scheduled_start_at,
    a.created_at as booked_at,
    
    -- Patient info
    pu.full_name as patient_name,
    pu.phone as patient_phone,
    
    -- Clinician info
    cu.full_name as clinician_name,
    
    -- Centre info
    c.name as centre_name,
    
    -- Payment info
    p.id as payment_id,
    p.payment_method,
    p.payment_notes,
    p.amount,
    p.status as payment_status,
    p.paid_at,
    
    -- Determine if payment note exists
    CASE 
        WHEN p.payment_notes IS NOT NULL AND p.payment_notes != '' 
        THEN 'Yes' 
        ELSE 'No' 
    END as has_payment_note

FROM appointments a

-- Join patient info
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users pu ON pp.user_id = pu.id

-- Join clinician info
LEFT JOIN clinician_profiles cp ON a.clinician_id = cp.id
LEFT JOIN users cu ON cp.user_id = cu.id

-- Join centre info
LEFT JOIN centres c ON a.centre_id = c.id

-- Join payment info
LEFT JOIN payments p ON a.id = p.appointment_id AND p.status = 'SUCCESS'

WHERE a.created_at >= CURRENT_DATE - INTERVAL '30 days'

ORDER BY a.created_at DESC
LIMIT 20;

-- ============================================
-- Count appointments by payment method with notes
-- ============================================
SELECT 
    p.payment_method,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN p.payment_notes IS NOT NULL AND p.payment_notes != '' THEN 1 END) as payments_with_notes,
    COUNT(CASE WHEN p.payment_notes IS NULL OR p.payment_notes = '' THEN 1 END) as payments_without_notes
FROM payments p
WHERE p.status = 'SUCCESS'
  AND p.payment_method IN ('CASH', 'CARD', 'UPI')
GROUP BY p.payment_method;

-- ============================================
-- Get specific payment note by appointment ID
-- ============================================
-- Replace <appointment_id> with actual ID
/*
SELECT 
    a.id as appointment_id,
    p.payment_method,
    p.payment_notes,
    p.amount,
    p.paid_at,
    pu.full_name as patient_name
FROM appointments a
JOIN payments p ON a.id = p.appointment_id
JOIN patient_profiles pp ON a.patient_id = pp.id
JOIN users pu ON pp.user_id = pu.id
WHERE a.id = <appointment_id>
  AND p.status = 'SUCCESS';
*/
