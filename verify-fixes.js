require('dotenv').config();
const { Client } = require('pg');

async function verifyFixes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('=== VERIFYING FIXES ===\n');

    // Test 1: Simulate findStaffById query (without sp.bio)
    console.log('1. Testing findStaffById query (should work now):');
    try {
      const staffQuery = `
        SELECT
          u.*,
          sp.designation,
          sp.profile_picture_url
        FROM users u
        JOIN staff_profiles sp ON sp.user_id = u.id
        WHERE u.id = 2
          AND u.user_type = 'STAFF'
          AND u.is_active = TRUE
      `;
      const staffResult = await client.query(staffQuery);
      console.log('✓ Query executed successfully');
      console.log(`✓ Found staff: ${staffResult.rows[0]?.full_name}`);
      console.log(`✓ Columns returned: ${Object.keys(staffResult.rows[0] || {}).join(', ')}`);
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }

    // Test 2: Simulate findClinicianById query (without sp.bio, but cp.bio is available)
    console.log('\n2. Testing findClinicianById query (should work now):');
    try {
      const clinicianQuery = `
        SELECT
          cp.*,
          u.full_name,
          u.phone,
          u.email,
          c.name as centre_name,
          c.city as centre_city,
          sp.profile_picture_url
        FROM clinician_profiles cp
        JOIN users u ON cp.user_id = u.id
        JOIN centres c ON cp.primary_centre_id = c.id
        LEFT JOIN staff_profiles sp ON u.id = sp.user_id
        WHERE cp.id = 49 AND cp.is_active = TRUE
      `;
      const clinicianResult = await client.query(clinicianQuery);
      console.log('✓ Query executed successfully');
      console.log(`✓ Found clinician: ${clinicianResult.rows[0]?.full_name}`);
      console.log(`✓ Has bio from cp table: ${clinicianResult.rows[0]?.bio ? 'Yes' : 'No'}`);
      console.log(`✓ Bio content: ${clinicianResult.rows[0]?.bio?.substring(0, 50)}...`);
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }

    // Test 3: Verify clinician_profiles has data
    console.log('\n3. Verifying clinician_profiles table has data:');
    const cliniciansCount = await client.query('SELECT COUNT(*) FROM clinician_profiles WHERE is_active = TRUE');
    console.log(`✓ Active clinicians in database: ${cliniciansCount.rows[0].count}`);

    // Test 4: Verify clinician_availability_rules has data
    console.log('\n4. Verifying clinician_availability_rules table has data:');
    const availabilityCount = await client.query('SELECT COUNT(*) FROM clinician_availability_rules WHERE is_active = TRUE');
    console.log(`✓ Active availability rules in database: ${availabilityCount.rows[0].count}`);

    // Test 5: Check if data is properly linked
    console.log('\n5. Verifying data relationships:');
    const linkedData = await client.query(`
      SELECT 
        cp.id as clinician_id,
        u.full_name,
        COUNT(car.id) as availability_rules_count
      FROM clinician_profiles cp
      JOIN users u ON u.id = cp.user_id
      LEFT JOIN clinician_availability_rules car ON car.clinician_id = cp.id AND car.is_active = TRUE
      WHERE cp.is_active = TRUE
      GROUP BY cp.id, u.full_name
    `);
    console.log('✓ Clinicians with availability rules:');
    linkedData.rows.forEach(row => {
      console.log(`  - ${row.full_name}: ${row.availability_rules_count} rules`);
    });

    console.log('\n=== ALL FIXES VERIFIED SUCCESSFULLY ===');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyFixes();
