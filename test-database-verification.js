// Comprehensive database verification and testing
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:g20m340i@localhost:5432/mibo-development-db';

async function verifyDatabase() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('=== CRITICAL COLUMNS VERIFICATION ===\n');

    // Check 1: users.username
    const usernameCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'username'
    `);
    
    if (usernameCheck.rows.length > 0) {
      console.log('✅ users.username EXISTS');
      console.log('   Type:', usernameCheck.rows[0].data_type);
      console.log('   Nullable:', usernameCheck.rows[0].is_nullable);
    } else {
      console.log('❌ users.username MISSING - MIGRATION NEEDED!');
    }

    // Check 2: clinician_profiles.years_of_experience
    const yearsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'clinician_profiles' 
      AND column_name IN ('years_of_experience', 'experience_years')
    `);
    
    if (yearsCheck.rows.length > 0) {
      const col = yearsCheck.rows[0];
      if (col.column_name === 'years_of_experience') {
        console.log('\n✅ clinician_profiles.years_of_experience EXISTS (CORRECT)');
        console.log('   Type:', col.data_type);
      } else {
        console.log('\n❌ clinician_profiles.experience_years EXISTS (WRONG NAME)');
        console.log('   MIGRATION NEEDED: Rename to years_of_experience');
      }
    } else {
      console.log('\n❌ clinician_profiles years column MISSING - MIGRATION NEEDED!');
    }

    // Check 3: centre_staff_assignments.role_id
    const roleIdCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'centre_staff_assignments' 
      AND column_name = 'role_id'
    `);
    
    if (roleIdCheck.rows.length > 0) {
      const col = roleIdCheck.rows[0];
      if (col.is_nullable === 'NO') {
        console.log('\n✅ centre_staff_assignments.role_id EXISTS and is NOT NULL (CORRECT)');
        console.log('   Type:', col.data_type);
      } else {
        console.log('\n⚠️  centre_staff_assignments.role_id EXISTS but is NULLABLE');
        console.log('   MIGRATION NEEDED: Make it NOT NULL');
      }
    } else {
      console.log('\n❌ centre_staff_assignments.role_id MISSING - MIGRATION NEEDED!');
    }

    console.log('\n\n=== TESTING PATIENT LIST QUERY ===\n');

    // Test the actual patient list query
    try {
      const patientsQuery = await client.query(`
        SELECT 
          u.id as user_id,
          u.full_name,
          u.phone,
          u.email,
          u.username,
          u.created_at,
          pp.id as profile_id,
          pp.date_of_birth,
          pp.gender,
          pp.blood_group,
          (
            SELECT COUNT(*) 
            FROM appointments a 
            WHERE a.patient_id = u.id 
            AND a.scheduled_start_at > NOW()
            AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
          ) as upcoming_appointments_count,
          (
            SELECT COUNT(*) 
            FROM appointments a 
            WHERE a.patient_id = u.id 
            AND a.scheduled_start_at <= NOW()
          ) as past_appointments_count
        FROM users u
        LEFT JOIN patient_profiles pp ON u.id = pp.user_id
        WHERE u.user_type = 'PATIENT' AND u.is_active = TRUE
        ORDER BY u.created_at DESC
        LIMIT 5
      `);

      console.log('✅ Patient list query executed successfully!');
      console.log(`   Found ${patientsQuery.rows.length} patients`);
      
      if (patientsQuery.rows.length > 0) {
        console.log('\n   Sample patient data:');
        const sample = patientsQuery.rows[0];
        console.log('   - Name:', sample.full_name);
        console.log('   - Phone:', sample.phone);
        console.log('   - Email:', sample.email || 'N/A');
        console.log('   - Username:', sample.username || 'N/A');
        console.log('   - Upcoming appointments:', sample.upcoming_appointments_count);
        console.log('   - Past appointments:', sample.past_appointments_count);
      } else {
        console.log('   No patients found in database (this is OK if database is empty)');
      }
    } catch (queryError) {
      console.log('❌ Patient list query FAILED!');
      console.log('   Error:', queryError.message);
    }

    console.log('\n\n=== TESTING CLINICIAN QUERY ===\n');

    // Test clinician query with correct column name
    try {
      const cliniciansQuery = await client.query(`
        SELECT
          cp.id,
          cp.user_id,
          u.full_name,
          u.phone,
          u.email,
          cp.specialization,
          cp.registration_number,
          cp.years_of_experience,
          cp.consultation_fee,
          cp.primary_centre_id,
          c.name as centre_name
        FROM clinician_profiles cp
        JOIN users u ON cp.user_id = u.id
        JOIN centres c ON cp.primary_centre_id = c.id
        WHERE cp.is_active = TRUE AND u.is_active = TRUE
        LIMIT 5
      `);

      console.log('✅ Clinician query executed successfully!');
      console.log(`   Found ${cliniciansQuery.rows.length} clinicians`);
      
      if (cliniciansQuery.rows.length > 0) {
        console.log('\n   Sample clinician data:');
        const sample = cliniciansQuery.rows[0];
        console.log('   - Name:', sample.full_name);
        console.log('   - Specialization:', sample.specialization);
        console.log('   - Years of experience:', sample.years_of_experience);
        console.log('   - Fee:', sample.consultation_fee);
      }
    } catch (queryError) {
      console.log('❌ Clinician query FAILED!');
      console.log('   Error:', queryError.message);
      if (queryError.message.includes('experience_years')) {
        console.log('   ⚠️  Column name issue detected - needs migration!');
      }
    }

    console.log('\n\n=== SUMMARY ===\n');
    
    const allChecks = [
      usernameCheck.rows.length > 0,
      yearsCheck.rows.length > 0 && yearsCheck.rows[0].column_name === 'years_of_experience',
      roleIdCheck.rows.length > 0 && roleIdCheck.rows[0].is_nullable === 'NO'
    ];

    if (allChecks.every(check => check)) {
      console.log('🎉 ALL CHECKS PASSED!');
      console.log('✅ NO MIGRATION NEEDED');
      console.log('✅ Database is ready for deployment');
    } else {
      console.log('⚠️  SOME CHECKS FAILED');
      console.log('❌ MIGRATION REQUIRED');
      console.log('📖 See AWS_DATABASE_MIGRATION_GUIDE.md for instructions');
    }

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyDatabase();
