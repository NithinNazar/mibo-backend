const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Verifying admin user creation...\n');

    // Check users table
    const userResult = await client.query(`
      SELECT id, full_name, phone, email, user_type, created_at
      FROM users
      WHERE user_type = 'STAFF'
      ORDER BY id DESC
      LIMIT 1;
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No admin user found!');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User Account:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.full_name);
    console.log('   Phone:', user.phone);
    console.log('   Email:', user.email);
    console.log('   Type:', user.user_type);
    console.log('   Created:', user.created_at);
    console.log('');

    // Check staff_profiles table
    const staffResult = await client.query(`
      SELECT id, user_id, designation, is_active, created_at
      FROM staff_profiles
      WHERE user_id = $1;
    `, [user.id]);

    if (staffResult.rows.length === 0) {
      console.log('❌ No staff profile found for this user!');
      return;
    }

    const staff = staffResult.rows[0];
    console.log('✅ Staff Profile:');
    console.log('   ID:', staff.id);
    console.log('   User ID:', staff.user_id);
    console.log('   Designation:', staff.designation);
    console.log('   Active:', staff.is_active);
    console.log('   Created:', staff.created_at);
    console.log('');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 VERIFICATION SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════');
    console.log('You can now login with:');
    console.log(`Phone: ${user.phone}`);
    console.log('Password: Mibo(2026)');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyAdmin();
