// Check the legacy user data
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:g20m340i@localhost:5432/mibo-development-db'
});

async function checkLegacyUser() {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.phone,
        u.first_name,
        u.last_name,
        u.full_name,
        u.email,
        p.age,
        p.gender,
        p.date_of_birth
      FROM users u
      LEFT JOIN patient_profiles p ON u.id = p.user_id
      WHERE u.phone = '919048810697';
    `);
    
    console.log('\n=== Legacy User Data (Phone: 919048810697) ===');
    if (result.rows.length === 0) {
      console.log('❌ User not found!');
    } else {
      const user = result.rows[0];
      console.log(`User ID: ${user.id}`);
      console.log(`Phone: ${user.phone}`);
      console.log(`First Name: ${user.first_name || '❌ MISSING'}`);
      console.log(`Last Name: ${user.last_name || '❌ MISSING'}`);
      console.log(`Full Name: ${user.full_name || '❌ MISSING'}`);
      console.log(`Email: ${user.email || 'Not set'}`);
      console.log(`Age: ${user.age || '❌ MISSING'}`);
      console.log(`Gender: ${user.gender || '❌ MISSING'}`);
      console.log(`Date of Birth: ${user.date_of_birth || '❌ MISSING'}`);
      
      const isLegacy = !user.first_name || !user.last_name;
      const hasIncompleteProfile = !user.age || !user.gender;
      
      console.log(`\n📊 Status:`);
      console.log(`Is Legacy User (missing name): ${isLegacy}`);
      console.log(`Has Incomplete Profile (missing age/gender): ${hasIncompleteProfile}`);
      console.log(`Should Show ProfileCompletionModal: ${isLegacy && hasIncompleteProfile}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLegacyUser();
