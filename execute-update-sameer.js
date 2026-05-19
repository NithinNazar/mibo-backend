// Script to update existing user to Sameer
const { Client } = require('pg');
const fs = require('fs');

async function updateSameer() {
  const client = new Client({
    connectionString: 'postgresql://postgres:g20m340i@localhost:5432/mibo-development-db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('🔄 Updating user with phone 918218330353...\n');

    // Read and execute the SQL file
    const sql = fs.readFileSync('update-sameer.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ User updated successfully!\n');
    
    // Verify the update
    console.log('📋 UPDATED USER DETAILS:');
    console.log('=' .repeat(80));
    const result = await client.query(`
      SELECT 
        u.id as user_id,
        u.full_name,
        u.phone,
        u.email,
        u.user_type,
        pp.id as profile_id,
        pp.mrn,
        pp.registration_fee_paid,
        pp.registration_fee_paid_at,
        u.updated_at
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      WHERE u.phone = '918218330353';
    `);
    
    console.table(result.rows);
    
    console.log('\n✅ SUCCESS! Changes made:');
    console.log('   ✓ Name: TM → Sameer');
    console.log('   ✓ Email: null → sameer@gmail.com');
    console.log('   ✓ Registration Fee Paid: false → true');
    console.log('   ✓ Registration Fee Paid At: null → 2026-01-15 10:00:00\n');
    
    console.log('📱 Sameer can now:');
    console.log('   - Login with phone: 918218330353');
    console.log('   - Book appointments (NO ₹100 registration fee)');
    console.log('   - Only pay consultation fee\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateSameer();
