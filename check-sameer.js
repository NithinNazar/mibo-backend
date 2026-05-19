// Check if Sameer already exists
const { Client } = require('pg');

async function checkSameer() {
  const client = new Client({
    connectionString: 'postgresql://postgres:g20m340i@localhost:5432/mibo-development-db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('🔍 Checking for phone: 918218330353\n');
    
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
      ORDER BY u.created_at DESC;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ USER FOUND:');
      console.log('=' .repeat(80));
      console.table(result.rows);
      
      const user = result.rows[0];
      console.log('\n📊 SUMMARY:');
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Email: ${user.email || 'Not set'}`);
      console.log(`   Registration Fee Paid: ${user.registration_fee_paid ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   MRN: ${user.mrn || 'Not assigned'}`);
      
      if (!user.registration_fee_paid) {
        console.log('\n⚠️  This user will be charged ₹100 registration fee on next booking');
        console.log('   Do you want to update registration_fee_paid to true? (Y/N)');
      } else {
        console.log('\n✅ This user will NOT be charged registration fee (already paid)');
      }
    } else {
      console.log('❌ No user found with phone: 918218330353');
      console.log('   The phone number is available for registration');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSameer();
