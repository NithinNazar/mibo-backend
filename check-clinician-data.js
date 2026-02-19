require('dotenv').config();
const { Client } = require('pg');

async function checkData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('=== CHECKING CLINICIAN DATA IN DATABASE ===\n');

    // Check users table for clinicians
    console.log('1. USERS with STAFF type:');
    const users = await client.query(`
      SELECT id, full_name, phone, email, user_type, is_active
      FROM users
      WHERE user_type = 'STAFF'
      ORDER BY id DESC
      LIMIT 5
    `);
    console.log(`Found ${users.rows.length} staff users:`);
    users.rows.forEach(u => {
      console.log(`  - ID: ${u.id}, Name: ${u.full_name}, Phone: ${u.phone}, Active: ${u.is_active}`);
    });

    // Check staff_profiles
    console.log('\n2. STAFF_PROFILES:');
    const staffProfiles = await client.query(`
      SELECT sp.*, u.full_name
      FROM staff_profiles sp
      JOIN users u ON u.id = sp.user_id
      ORDER BY sp.id DESC
      LIMIT 5
    `);
    console.log(`Found ${staffProfiles.rows.length} staff profiles:`);
    staffProfiles.rows.forEach(sp => {
      console.log(`  - ID: ${sp.id}, User: ${sp.full_name}, Designation: ${sp.designation}`);
      console.log(`    Has bio column: ${sp.hasOwnProperty('bio')}`);
    });

    // Check clinician_profiles
    console.log('\n3. CLINICIAN_PROFILES:');
    const clinicians = await client.query(`
      SELECT cp.*, u.full_name
      FROM clinician_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.is_active = TRUE
      ORDER BY cp.id DESC
      LIMIT 5
    `);
    console.log(`Found ${clinicians.rows.length} clinician profiles:`);
    clinicians.rows.forEach(cp => {
      console.log(`  - ID: ${cp.id}, User: ${cp.full_name}`);
      console.log(`    Specialization: ${JSON.stringify(cp.specialization)}`);
      console.log(`    Qualification: ${JSON.stringify(cp.qualification)}`);
      console.log(`    Languages: ${JSON.stringify(cp.languages)}`);
      console.log(`    Has bio: ${cp.bio ? 'Yes' : 'No'}`);
    });

    // Check clinician_availability_rules
    console.log('\n4. CLINICIAN_AVAILABILITY_RULES:');
    const availability = await client.query(`
      SELECT car.*, cp.id as clinician_profile_id, u.full_name
      FROM clinician_availability_rules car
      JOIN clinician_profiles cp ON cp.id = car.clinician_id
      JOIN users u ON u.id = cp.user_id
      WHERE car.is_active = TRUE
      ORDER BY car.id DESC
      LIMIT 10
    `);
    console.log(`Found ${availability.rows.length} availability rules:`);
    availability.rows.forEach(ar => {
      console.log(`  - Rule ID: ${ar.id}, Clinician: ${ar.full_name}`);
      console.log(`    Day: ${ar.day_of_week}, Time: ${ar.start_time} - ${ar.end_time}, Mode: ${ar.mode}`);
    });

    // Check user_roles for clinicians
    console.log('\n5. USER_ROLES for clinicians:');
    const userRoles = await client.query(`
      SELECT ur.*, u.full_name, r.name as role_name
      FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.role_id = 4
      ORDER BY ur.id DESC
      LIMIT 5
    `);
    console.log(`Found ${userRoles.rows.length} user roles with CLINICIAN role:`);
    userRoles.rows.forEach(ur => {
      console.log(`  - User: ${ur.full_name}, Role: ${ur.role_name}, Active: ${ur.is_active}`);
    });

    // Check centre_staff_assignments
    console.log('\n6. CENTRE_STAFF_ASSIGNMENTS for clinicians:');
    const assignments = await client.query(`
      SELECT csa.*, u.full_name, c.name as centre_name
      FROM centre_staff_assignments csa
      JOIN users u ON u.id = csa.user_id
      JOIN centres c ON c.id = csa.centre_id
      WHERE csa.role_id = 4
      ORDER BY csa.id DESC
      LIMIT 5
    `);
    console.log(`Found ${assignments.rows.length} centre assignments for clinicians:`);
    assignments.rows.forEach(a => {
      console.log(`  - User: ${a.full_name}, Centre: ${a.centre_name}, Active: ${a.is_active}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkData();
