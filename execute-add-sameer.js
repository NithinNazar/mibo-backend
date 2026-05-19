// Script to add Sameer as a patient
const { Client } = require('pg');
const fs = require('fs');

async function addSameer() {
  const client = new Client({
    connectionString: 'postgresql://postgres:g20m340i@localhost:5432/mibo-development-db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read and execute the SQL file
    const sql = fs.readFileSync('add-sameer-patient.sql', 'utf8');
    
    // Execute the transaction
    await client.query(sql);
    
    console.log('✅ Patient "Sameer" added successfully!\n');
    
    // Verify the patient was added
    console.log('📋 VERIFICATION - Patient Details:');
    console.log('=' .repeat(80));
    const result = await client.query(`
      SELECT 
        u.id as user_id,
        u.full_name,
        u.phone,
        u.email,
        u.user_type,
        u.is_active as user_active,
        pp.id as profile_id,
        pp.mrn,
        pp.registration_fee_paid,
        pp.registration_fee_paid_at,
        pp.is_active as profile_active,
        u.created_at
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      WHERE u.phone = '918218330353'
      ORDER BY u.created_at DESC
      LIMIT 1;
    `);
    
    if (result.rows.length > 0) {
      console.table(result.rows);
      console.log('\n✅ SUCCESS! Sameer can now:');
      console.log('   - Login with phone: 918218330353');
      console.log('   - Book appointments (NO ₹100 registration fee)');
      console.log('   - Only pay consultation fee\n');
    } else {
      console.log('❌ Patient not found after insertion');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '23505') {
      console.error('\n⚠️  This phone number or email already exists in the database!');
      console.error('   Please check if Sameer is already registered.\n');
    }
  } finally {
    await client.end();
  }
}

addSameer();
