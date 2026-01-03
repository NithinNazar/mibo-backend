-- ============================================
-- POPULATE DATABASE WITH REAL DOCTOR DATA
-- Matching frontend static data from doctors.ts
-- ============================================

-- First, let's create centres (Bangalore, Kochi, Mumbai)
INSERT INTO centres (name, city, address_line1, address_line2, pincode, contact_phone, timezone, is_active) VALUES
('Mibo Bangalore', 'Bangalore', 'HSR Layout', 'Sector 1', '560102', '08041510000', 'Asia/Kolkata', true),
('Mibo Kochi', 'Kochi', 'Marine Drive', 'Ernakulam', '682031', '04844010000', 'Asia/Kolkata', true),
('Mibo Mumbai', 'Mumbai', 'Andheri West', 'Mumbai', '400053', '02226710000', 'Asia/Kolkata', true)
ON CONFLICT DO NOTHING;

-- Get centre IDs (we'll use 1, 2, 3 for Bangalore, Kochi, Mumbai)
-- Bangalore = 1, Kochi = 2, Mumbai = 3

-- ============================================
-- BANGALORE DOCTORS (16 doctors)
-- ============================================

-- 1. Dr. Jini K. Gopinath
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501001', 'jini.gopinath@mibo.com', 'Dr. Jini K. Gopinath', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'jini.gopinath@mibo.com'), 1, 'Clinical Hypnotherapist, Senior Clinical Psychologist', 'RCI-12345', 10, 'Senior Clinical Psychologist and Advisor at Mibo with expertise in anxiety, depression, stress, trauma, and sleep issues.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 2. Dr. Muhammed Sadik T.M
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501002', 'sadik.tm@mibo.com', 'Dr. Muhammed Sadik T.M', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'sadik.tm@mibo.com'), 1, 'Ph.D., M.Phil (Clinical Psychology), Director of Psychology Services', 'RCI-12346', 10, 'Director of Psychology Services with expertise in depression, anxiety, relationships, work stress, and PTSD.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 3. Dr. Prajwal Devurkar
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501003', 'prajwal.devurkar@mibo.com', 'Dr. Prajwal Devurkar', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'prajwal.devurkar@mibo.com'), 1, 'MBBS, MD - Medical Director, Head of Operations', 'MCI-12347', 8, 'Medical Director and Head of Operations specializing in bipolar disorder, schizophrenia, OCD, and mood disorders.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 4. Ashir Sahal K. T
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501004', 'ashir.sahal@mibo.com', 'Ashir Sahal K. T', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'ashir.sahal@mibo.com'), 1, 'M.Sc, M.Phil (Clinical Psychology)', 'RCI-12348', 4, 'Clinical Psychologist with expertise in anxiety, depression, stress, and relationships.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 5. Hridya V M
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501005', 'hridya.vm@mibo.com', 'Hridya V M', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'hridya.vm@mibo.com'), 1, 'M.Sc, M.Phil - Head of the Department, Clinical Psychologist', 'RCI-12349', 5, 'Head of the Department specializing in anxiety, depression, trauma, and family therapy.', '["ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 6. Abhinand P.S
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501006', 'abhinand.ps@mibo.com', 'Abhinand P.S', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'abhinand.ps@mibo.com'), 1, 'M.Phil (Clinical Psychology)', 'RCI-12350', 3, 'Clinical Psychologist with expertise in stress, anxiety, work stress, and relationships.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 7. Dr. Srinivas Reddy
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501007', 'srinivas.reddy@mibo.com', 'Dr. Srinivas Reddy', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'srinivas.reddy@mibo.com'), 1, 'MBBS, MRCPsych - Consultant Psychiatrist', 'MCI-12351', 7, 'Consultant Psychiatrist specializing in depression, anxiety, bipolar disorder, and schizophrenia.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 8. Shamroz Abdu
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501008', 'shamroz.abdu@mibo.com', 'Shamroz Abdu', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'shamroz.abdu@mibo.com'), 1, 'M.Sc, M.Phil (Clinical Psychology)', 'RCI-12352', 4, 'Clinical Psychologist with expertise in anxiety, depression, stress, and trauma.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 9. Mauli Rastogi
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501009', 'mauli.rastogi@mibo.com', 'Mauli Rastogi', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'mauli.rastogi@mibo.com'), 1, 'M.Phil, M.Sc (Clinical Psychology)', 'RCI-12353', 4, 'Clinical Psychologist with expertise in anxiety, depression, relationships, and self-esteem.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 10. Ajay Siby
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501010', 'ajay.siby@mibo.com', 'Ajay Siby', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'ajay.siby@mibo.com'), 1, 'M.Sc. Clinical Psychology - Counselling Psychologist', 'RCI-12354', 3, 'Counselling Psychologist with expertise in stress, anxiety, work stress, and relationships.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 11. Dr. Miller A M
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501011', 'miller.am@mibo.com', 'Dr. Miller A M', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'miller.am@mibo.com'), 1, 'MBBS, MD (Psychiatry), PDF (Emergency Psychiatry) - Consultant Psychiatrist', 'MCI-12355', 5, 'Consultant Psychiatrist with expertise in depression, anxiety, bipolar disorder, OCD, and PTSD.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 12. Naufal M. A
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501012', 'naufal.ma@mibo.com', 'Naufal M. A', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'naufal.ma@mibo.com'), 1, 'M.Phil (Clinical Psychology)', 'RCI-12356', 3, 'Clinical Psychologist with expertise in anxiety, depression, stress, and trauma.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 13. Dr Vishakh Biradar
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501013', 'vishakh.biradar@mibo.com', 'Dr Vishakh Biradar', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'vishakh.biradar@mibo.com'), 1, 'MD (Psychiatry), PDF in Child & Adolescent Psychiatry - Consultant Child & Adolescent Psychiatrist', 'MCI-12357', 5, 'Consultant Child & Adolescent Psychiatrist specializing in ADHD, autism, child anxiety, adolescent issues, and OCD.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 14. Jerry P Mathew
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501014', 'jerry.mathew@mibo.com', 'Jerry P Mathew', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'jerry.mathew@mibo.com'), 1, 'M.Sc, M.Phil (Clinical Psychology)', 'RCI-12358', 4, 'Clinical Psychologist with expertise in anxiety, depression, relationships, and stress.', '["ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 15. Yashaswini R S
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501015', 'yashaswini.rs@mibo.com', 'Yashaswini R S', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'yashaswini.rs@mibo.com'), 1, 'M.Phil Clinical Psychology', 'RCI-12359', 3, 'Clinical Psychologist with expertise in anxiety, depression, stress, and self-esteem.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 16. Lincy Benny B
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876501016', 'lincy.benny@mibo.com', 'Lincy Benny B', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'lincy.benny@mibo.com'), 1, 'M.Phil (Clinical Psychology)', 'RCI-12360', 3, 'Clinical Psychologist with expertise in anxiety, depression, trauma, and relationships.', '["ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- KOCHI DOCTORS (6 doctors)
-- ============================================

-- 17. Dr Thomas Mathai
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876502001', 'thomas.mathai@mibo.com', 'Dr Thomas Mathai', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'thomas.mathai@mibo.com'), 2, 'MBBS, DPM, DNB - Consultant Psychiatrist', 'MCI-12361', 6, 'Consultant Psychiatrist with expertise in depression, anxiety, bipolar disorder, and schizophrenia.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 18. Sruthi Annie Vincent
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876502002', 'sruthi.vincent@mibo.com', 'Sruthi Annie Vincent', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'sruthi.vincent@mibo.com'), 2, 'M.Phil. Clinical Psychology', 'RCI-12362', 5, 'Clinical Psychologist with expertise in anxiety, depression, trauma, and family therapy.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 19. Dr Sangeetha O S
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876502003', 'sangeetha.os@mibo.com', 'Dr Sangeetha O S', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'sangeetha.os@mibo.com'), 2, 'MBBS MD - Consultant Psychiatrist', 'MCI-12363', 2, 'Consultant Psychiatrist with expertise in depression, anxiety, OCD, and mood disorders.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 20. Dr Anu Sobha
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876502004', 'anu.sobha@mibo.com', 'Dr Anu Sobha', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'anu.sobha@mibo.com'), 2, 'MBBS, DPM, PGDFM - Consultant Psychiatrist', 'MCI-12364', 7, 'Consultant Psychiatrist with expertise in depression, anxiety, PTSD, and bipolar disorder.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 21. Anet Augustine
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876502005', 'anet.augustine@mibo.com', 'Anet Augustine', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'anet.augustine@mibo.com'), 2, 'M.Phil (Clinical Psychology)', 'RCI-12365', 3, 'Clinical Psychologist with expertise in anxiety, depression, stress, and relationships.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- 22. Ria Mary
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876502006', 'ria.mary@mibo.com', 'Ria Mary', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'ria.mary@mibo.com'), 2, 'M.Phil, M.Sc (Clinical Psychology) - Licensed by RCI', 'RCI-12366', 3, 'Clinical Psychologist with expertise in anxiety, depression, trauma, and family therapy.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- MUMBAI DOCTORS (1 doctor)
-- ============================================

-- 23. Dhruvi Kiklawala
INSERT INTO users (phone, email, full_name, user_type, is_active) VALUES
('919876503001', 'dhruvi.kiklawala@mibo.com', 'Dhruvi Kiklawala', 'STAFF', true)
ON CONFLICT DO NOTHING;

INSERT INTO clinician_profiles (user_id, primary_centre_id, specialization, registration_number, years_of_experience, bio, consultation_modes, default_consultation_duration_minutes, consultation_fee, is_active) VALUES
((SELECT id FROM users WHERE email = 'dhruvi.kiklawala@mibo.com'), 3, 'M.Sc, M.Phil - Clinical Psychologist', 'RCI-12367', 3, 'Clinical Psychologist with expertise in anxiety, depression, stress, and relationships.', '["IN_PERSON", "ONLINE"]', 50, 1600, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- ADD AVAILABILITY RULES FOR ALL DOCTORS
-- Monday to Friday, 9 AM to 6 PM, 50-minute slots
-- ============================================

-- For all Bangalore doctors (IDs 1-16)
INSERT INTO clinician_availability_rules (clinician_id, centre_id, day_of_week, start_time, end_time, slot_duration_minutes, mode, is_active)
SELECT 
    cp.id as clinician_id,
    1 as centre_id,
    day_of_week,
    '09:00:00' as start_time,
    '18:00:00' as end_time,
    50 as slot_duration_minutes,
    'ONLINE' as mode,
    true as is_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
CROSS JOIN generate_series(1, 5) as day_of_week
WHERE cp.primary_centre_id = 1
AND cp.consultation_modes::text LIKE '%ONLINE%'
ON CONFLICT DO NOTHING;

-- For Kochi doctors (IDs 17-22)
INSERT INTO clinician_availability_rules (clinician_id, centre_id, day_of_week, start_time, end_time, slot_duration_minutes, mode, is_active)
SELECT 
    cp.id as clinician_id,
    2 as centre_id,
    day_of_week,
    '09:00:00' as start_time,
    '18:00:00' as end_time,
    50 as slot_duration_minutes,
    'ONLINE' as mode,
    true as is_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
CROSS JOIN generate_series(1, 5) as day_of_week
WHERE cp.primary_centre_id = 2
AND cp.consultation_modes::text LIKE '%ONLINE%'
ON CONFLICT DO NOTHING;

-- For Mumbai doctors (ID 23)
INSERT INTO clinician_availability_rules (clinician_id, centre_id, day_of_week, start_time, end_time, slot_duration_minutes, mode, is_active)
SELECT 
    cp.id as clinician_id,
    3 as centre_id,
    day_of_week,
    '09:00:00' as start_time,
    '18:00:00' as end_time,
    50 as slot_duration_minutes,
    'ONLINE' as mode,
    true as is_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
CROSS JOIN generate_series(1, 5) as day_of_week
WHERE cp.primary_centre_id = 3
AND cp.consultation_modes::text LIKE '%ONLINE%'
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check centres
SELECT * FROM centres ORDER BY id;

-- Check all doctors
SELECT 
    u.id as user_id,
    u.full_name,
    cp.id as clinician_id,
    cp.specialization,
    c.name as centre_name,
    cp.consultation_fee,
    cp.is_active
FROM users u
JOIN clinician_profiles cp ON u.id = cp.user_id
JOIN centres c ON cp.primary_centre_id = c.id
ORDER BY cp.primary_centre_id, u.id;

-- Check availability rules
SELECT 
    u.full_name,
    c.name as centre,
    car.day_of_week,
    car.start_time,
    car.end_time,
    car.mode
FROM clinician_availability_rules car
JOIN clinician_profiles cp ON car.clinician_id = cp.id
JOIN users u ON cp.user_id = u.id
JOIN centres c ON car.centre_id = c.id
WHERE car.is_active = true
ORDER BY cp.id, car.day_of_week;

-- ============================================
-- SUMMARY
-- ============================================
-- Total Centres: 3 (Bangalore, Kochi, Mumbai)
-- Total Doctors: 23
--   - Bangalore: 16 doctors
--   - Kochi: 6 doctors
--   - Mumbai: 1 doctor
-- All doctors have:
--   - Consultation fee: ₹1600
--   - Availability: Monday-Friday, 9 AM - 6 PM
--   - Slot duration: 50 minutes
--   - Online consultations enabled
-- ============================================
