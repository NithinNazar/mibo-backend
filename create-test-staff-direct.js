require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestStaff() {
  const client = await pool.connect();
  
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Creating Test Staff Data Directly in Database         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    await client.query('BEGIN');

    // Get centre ID
    const centreResult = await client.query('SELECT id, name FROM centres LIMIT 1');
    if (centreResult.rows.length === 0) {
      throw new Error('No centres found. Please create a centre first.');
    }
    const centreId = centreResult.rows[0].id;
    console.log(`\n✓ Using centre: ${centreResult.rows[0].name} (ID: ${centreId})`);

    // Get role IDs
    const rolesResult = await client.query('SELECT id, name FROM roles');
    console.log(`\n✓ Found ${rolesResult.rows.length} roles:`);
    rolesResult.rows.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id})`);
    });

    const clinicianRoleId = rolesResult.rows.find(r => r.name === 'CLINICIAN')?.id;
    if (!clinicianRoleId) {
      throw new Error('CLINICIAN role not found');
    }

    // Create Clinician User
    console.log('\n=== Creating Clinician ===');
    const clinicianPassword = await bcrypt.hash('Clinician@123', 10);
    
    const clinicianUserResult = await client.query(`
      INSERT INTO users (full_name, phone, email, username, password_hash, user_type, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `, [
      'Dr. Ananya Menon',
      '9876543212',
      'ananya.menon@mibo.com',
      'dr.ananya',
      clinicianPassword,
      'STAFF',
      true
    ]);
    
    const clinicianUserId = clinicianUserResult.rows[0].id;
    console.log(`✓ Clinician user created (ID: ${clinicianUserId})`);

    // Assign clinician to centre
    await client.query(`
      INSERT INTO centre_staff_assignments (user_id, centre_id, role_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
    `, [clinicianUserId, centreId, clinicianRoleId]);
    console.log(`✓ Clinician assigned to centre`);

    // Create clinician profile
    await client.query(`
      INSERT INTO clinician_profiles (
        user_id, 
        primary_centre_id, 
        specialization, 
        qualification,
        languages,
        years_of_experience, 
        consultation_fee, 
        bio, 
        consultation_modes, 
        default_consultation_duration_minutes,
        expertise,
        profile_picture_url,
        is_active,
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
    `, [
      clinicianUserId,
      centreId,
      JSON.stringify(['Clinical Psychologist', 'Therapist']),
      JSON.stringify(['M.Phil', 'Ph.D.']),
      JSON.stringify(['English', 'Hindi', 'Malayalam']),
      8,
      1500,
      'Dr. Ananya Menon is a highly experienced clinical psychologist specializing in anxiety disorders, depression, and trauma therapy. With over 8 years of experience, she provides compassionate care to individuals and families.',
      JSON.stringify(['IN_PERSON', 'ONLINE']),
      45,
      JSON.stringify(['Anxiety Disorders', 'Depression', 'Trauma & PTSD', 'Stress Management']),
      'https://randomuser.me/api/portraits/women/44.jpg',
      true
    ]);
    console.log(`✓ Clinician profile created`);

    await client.query('COMMIT');

    // Verify
    console.log('\n=== Verification ===');
    const verifyResult = await client.query(`
      SELECT 
        u.id,
        u.full_name,
        u.phone,
        u.username,
        cp.specialization,
        cp.consultation_fee,
        cp.is_active
      FROM users u
      JOIN clinician_profiles cp ON u.id = cp.user_id
      WHERE u.user_type = 'STAFF'
        AND EXISTS (
          SELECT 1 FROM centre_staff_assignments csa
          WHERE csa.user_id = u.id AND csa.role_id = $1
        )
    `, [clinicianRoleId]);
    
    console.log(`✓ Found ${verifyResult.rows.length} clinician(s) in database:`);
    verifyResult.rows.forEach(clinician => {
      console.log(`  - ${clinician.full_name} (${clinician.username})`);
      console.log(`    Phone: ${clinician.phone}`);
      console.log(`    Fee: ₹${clinician.consultation_fee}`);
      console.log(`    Active: ${clinician.is_active}`);
    });

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SUCCESS!                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📝 Clinician Credentials:');
    console.log('   Username: dr.ananya');
    console.log('   Password: Clinician@123');
    console.log('\n✓ Check Admin Panel and Frontend to verify!');
    console.log('✓ The clinician should appear in:');
    console.log('   - Admin Panel: Staff > Clinicians');
    console.log('   - Frontend: Book Appointment page');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n✗ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTestStaff().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
