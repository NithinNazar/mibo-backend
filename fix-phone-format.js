const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixPhoneFormat() {
  const client = await pool.connect();
  
  try {
    console.log('\n📱 Fixing phone number format for admin login...\n');

    // Update phone number to remove +91 prefix
    const result = await client.query(`
      UPDATE users 
      SET phone = '9083335000', updated_at = NOW()
      WHERE id = 3 AND user_type = 'STAFF'
      RETURNING id, full_name, phone, email, user_type;
    `);

    if (result.rows.length === 0) {
      console.log('❌ No user found to update!');
      return;
    }

    const user = result.rows[0];
    console.log('✅ Phone number format fixed!');
    console.log('');
    console.log('Updated User:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.full_name);
    console.log('   Phone:', user.phone);
    console.log('   Email:', user.email);
    console.log('   Type:', user.user_type);
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! You can now login with:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Phone: ${user.phone} (without +91)`);
    console.log('Password: Mibo(2026)');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPhoneFormat();
