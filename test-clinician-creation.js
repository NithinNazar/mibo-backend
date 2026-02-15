const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testClinicianCreation() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== TESTING CLINICIAN CREATION ===\n');
    
    // Test data that matches what the frontend sends
    const testData = {
      full_name: "Test Clinician",
      phone: "9999999999",
      password: "Test@123",
      role_ids: [4], // CLINICIAN role
      centre_ids: [1], // Bangalore centre
      primary_centre_id: 1,
      specialization: ["Clinical Psychologist"],
      years_of_experience: 5,
      consultation_fee: 1500,
      consultation_modes: ["IN_PERSON", "ONLINE"],
      default_consultation_duration_minutes: 45,
      qualification: ["M.Phil"],
      languages: ["English", "Hindi"]
    };
    
    console.log('1. Test Data:', JSON.stringify(testData, null, 2));
    
    // Check if role_id 4 exists
    console.log('\n2. Checking if role_id 4 exists...');
    const roleCheck = await client.query('SELECT * FROM roles WHERE id = 4');
    if (roleCheck.rows.length === 0) {
      console.log('   ❌ Role ID 4 does not exist!');
      console.log('   Available roles:');
      const allRoles = await client.query('SELECT * FROM roles ORDER BY id');
      allRoles.rows.forEach(r => console.log(`     - ID: ${r.id}, Name: ${r.name}`));
    } else {
      console.log(`   ✓ Role ID 4 exists: ${roleCheck.rows[0].name}`);
    }
    
    // Check if centre_id 1 exists
    console.log('\n3. Checking if centre_id 1 exists...');
    const centreCheck = await client.query('SELECT * FROM centres WHERE id = 1');
    if (centreCheck.rows.length === 0) {
      console.log('   ❌ Centre ID 1 does not exist!');
    } else {
      console.log(`   ✓ Centre ID 1 exists: ${centreCheck.rows[0].name}`);
    }
    
    // Check foreign key constraints on centre_staff_assignments
    console.log('\n4. Checking foreign key constraints on centre_staff_assignments...');
    const fkQuery = `
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'centre_staff_assignments'
        AND tc.constraint_type = 'FOREIGN KEY'
    `;
    const fks = await client.query(fkQuery);
    fks.rows.forEach(fk => {
      console.log(`   - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Try to simulate what happens when creating a user
    console.log('\n5. Simulating user creation...');
    console.log('   Would insert into users table...');
    console.log('   Would insert into staff_profiles table...');
    console.log('   Would insert into user_roles table with role_id = 4');
    console.log('   Would insert into centre_staff_assignments with:');
    console.log(`     - centre_id = ${testData.centre_ids[0]}`);
    console.log(`     - role_id = ${testData.role_ids[0]}`);
    
    // Check if we can insert into centre_staff_assignments with these values
    console.log('\n6. Testing if centre_staff_assignments would accept these values...');
    
    // Check if role_id 4 exists (again, for emphasis)
    const roleExists = await client.query('SELECT id FROM roles WHERE id = $1', [testData.role_ids[0]]);
    if (roleExists.rows.length === 0) {
      console.log(`   ❌ PROBLEM: role_id ${testData.role_ids[0]} does not exist in roles table!`);
      console.log('   This is why you get "Referenced resource does not exist"');
    } else {
      console.log(`   ✓ role_id ${testData.role_ids[0]} exists`);
    }
    
    const centreExists = await client.query('SELECT id FROM centres WHERE id = $1', [testData.centre_ids[0]]);
    if (centreExists.rows.length === 0) {
      console.log(`   ❌ PROBLEM: centre_id ${testData.centre_ids[0]} does not exist in centres table!`);
    } else {
      console.log(`   ✓ centre_id ${testData.centre_ids[0]} exists`);
    }
    
    console.log('\n=== DIAGNOSIS ===');
    if (roleExists.rows.length === 0) {
      console.log('❌ The issue is that role_id 4 does not exist in your database!');
      console.log('   The frontend is sending role_ids: [4] but this role does not exist.');
      console.log('   You need to either:');
      console.log('   1. Create a role with ID 4 named "CLINICIAN"');
      console.log('   2. Or update the frontend to use the correct role ID');
    } else if (centreExists.rows.length === 0) {
      console.log('❌ The issue is that centre_id 1 does not exist!');
    } else {
      console.log('✓ Both role_id and centre_id exist. The issue might be elsewhere.');
      console.log('  Check the actual error message from the API for more details.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testClinicianCreation();
