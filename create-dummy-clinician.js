const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mibo-development-db',
  user: 'postgres',
  password: 'g20m340i',
});

async function createDummyClinician() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check for centres
    const centresResult = await client.query('SELECT id, name FROM centres WHERE is_active = TRUE LIMIT 1');
    if (centresResult.rows.length === 0) {
      throw new Error('No active centres found. Please create a centre first.');
    }
    const centreId = centresResult.rows[0].id;
    const centreName = centresResult.rows[0].name;

    // Check for clinician role, create if not exists
    let roleResult = await client.query("SELECT id FROM roles WHERE name = 'CLINICIAN'");
    let clinicianRoleId;
    
    if (roleResult.rows.length === 0) {
      console.log('Creating CLINICIAN role...');
      const newRoleResult = await client.query(
        "INSERT INTO roles (name, description) VALUES ('CLINICIAN', 'Medical professional providing consultations') RETURNING id"
      );
      clinicianRoleId = newRoleResult.rows[0].id;
      console.log('✅ CLINICIAN role created with ID:', clinicianRoleId);
    } else {
      clinicianRoleId = roleResult.rows[0].id;
    }

    // Create user
    const hashedPassword = await bcrypt.hash('Clinician@123', 10);
    const userResult = await client.query(
      `INSERT INTO users (phone, full_name, email, password_hash, user_type, is_active)
       VALUES ($1, $2, $3, $4, 'STAFF', TRUE)
       RETURNING *`,
      ['919876543210', 'Dr. Sarah Johnson', 'sarah.johnson@mibo.care', hashedPassword]
    );
    const userId = userResult.rows[0].id;

    // Create staff profile
    await client.query(
      `INSERT INTO staff_profiles (user_id, is_active)
       VALUES ($1, TRUE)`,
      [userId]
    );

    // Assign role
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)`,
      [userId, clinicianRoleId]
    );

    // Assign to centre
    await client.query(
      `INSERT INTO centre_staff_assignments (centre_id, user_id, role_id, is_active)
       VALUES ($1, $2, $3, TRUE)`,
      [centreId, userId, clinicianRoleId]
    );

    // Create clinician profile
    const clinicianResult = await client.query(
      `INSERT INTO clinician_profiles (
        user_id,
        primary_centre_id,
        registration_number,
        years_of_experience,
        bio,
        consultation_modes,
        default_consultation_duration_minutes,
        consultation_fee,
        specialization,
        qualification,
        expertise,
        languages,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
      RETURNING *`,
      [
        userId,
        centreId,
        'MCI-12345-2020',
        8,
        'Experienced psychiatrist specializing in anxiety and depression treatment',
        JSON.stringify(['IN_PERSON', 'ONLINE']),
        45,
        1500,
        JSON.stringify(['Psychiatry', 'Clinical Psychology']),
        JSON.stringify(['MBBS', 'MD Psychiatry']),
        JSON.stringify(['Anxiety Disorders', 'Depression', 'Stress Management', 'Cognitive Behavioral Therapy']),
        JSON.stringify(['English', 'Hindi', 'Kannada'])
      ]
    );

    const clinicianId = clinicianResult.rows[0].id;

    // Create availability slots (Monday to Friday, 9 AM - 5 PM)
    const availabilitySlots = [];
    for (let day = 1; day <= 5; day++) { // Monday to Friday
      // Morning slot: 9 AM - 1 PM
      await client.query(
        `INSERT INTO clinician_availability_rules (
          clinician_id,
          centre_id,
          day_of_week,
          start_time,
          end_time,
          slot_duration_minutes,
          mode,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
        [clinicianId, centreId, day, '09:00', '13:00', 45, 'IN_PERSON']
      );
      
      // Afternoon slot: 2 PM - 6 PM
      await client.query(
        `INSERT INTO clinician_availability_rules (
          clinician_id,
          centre_id,
          day_of_week,
          start_time,
          end_time,
          slot_duration_minutes,
          mode,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
        [clinicianId, centreId, day, '14:00', '18:00', 45, 'ONLINE']
      );
      
      availabilitySlots.push({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
        morning: '9:00 AM - 1:00 PM (In-Person)',
        afternoon: '2:00 PM - 6:00 PM (Online)'
      });
    }

    await client.query('COMMIT');

    console.log('\n✅ DUMMY CLINICIAN CREATED SUCCESSFULLY!\n');
    console.log('=== CLINICIAN DETAILS ===\n');
    console.log('Login Credentials:');
    console.log('  Phone: 919876543210');
    console.log('  Password: Clinician@123');
    console.log('  Email: sarah.johnson@mibo.care\n');
    
    console.log('Personal Information:');
    console.log('  Full Name: Dr. Sarah Johnson');
    console.log('  Registration Number: MCI-12345-2020');
    console.log('  Years of Experience: 8 years\n');
    
    console.log('Professional Details:');
    console.log('  Specialization: Psychiatry, Clinical Psychology');
    console.log('  Qualification: MBBS, MD Psychiatry');
    console.log('  Expertise: Anxiety Disorders, Depression, Stress Management, Cognitive Behavioral Therapy');
    console.log('  Languages: English, Hindi, Kannada\n');
    
    console.log('Consultation Details:');
    console.log('  Fee: ₹1,500 per session');
    console.log('  Session Duration: 45 minutes');
    console.log('  Modes: In-Person, Online');
    console.log('  Primary Centre: ' + centreName + ' (ID: ' + centreId + ')\n');
    
    console.log('Availability Schedule:');
    availabilitySlots.forEach(slot => {
      console.log('  ' + slot.day + ':');
      console.log('    Morning: ' + slot.morning);
      console.log('    Afternoon: ' + slot.afternoon);
    });
    
    console.log('\nBio:');
    console.log('  "Experienced psychiatrist specializing in anxiety and depression treatment"\n');
    
    console.log('Database IDs:');
    console.log('  User ID: ' + userId);
    console.log('  Clinician Profile ID: ' + clinicianId);
    console.log('  Centre ID: ' + centreId);
    console.log('  Role ID: ' + clinicianRoleId + '\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating clinician:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createDummyClinician();
