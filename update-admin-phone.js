/**
 * Update Admin Phone Number
 * 
 * This script updates the admin user's phone number to 9048810697
 * 
 * Run: node update-admin-phone.js
 */

const { db } = require('./dist/config/db');

async function updateAdminPhone() {
  try {
    console.log('\n🔧 Updating Admin Phone Number...\n');

    const NEW_PHONE = '919048810697';
    const OLD_ADMIN_PHONE = '919999999999';

    // First, check if the phone number is already in use
    console.log('📝 Checking existing phone numbers...');
    const existingUser = await db.oneOrNone(
      'SELECT id, username, user_type FROM users WHERE phone = $1',
      [NEW_PHONE]
    );

    if (existingUser) {
      console.log(`  Found existing user with phone ${NEW_PHONE}:`);
      console.log(`    ID: ${existingUser.id}`);
      console.log(`    Username: ${existingUser.username || 'N/A'}`);
      console.log(`    Type: ${existingUser.user_type}`);

      if (existingUser.user_type === 'PATIENT') {
        console.log('\n  This is a patient user. Updating their phone to a temporary number...');
        await db.none(
          'UPDATE users SET phone = $1 WHERE id = $2',
          ['919999999998', existingUser.id]
        );
        console.log('  ✓ Patient phone updated to temporary number');
      }
    }

    // Update admin phone number
    console.log('\n📝 Updating admin phone number...');
    const result = await db.one(
      `UPDATE users 
       SET phone = $1 
       WHERE username = 'admin'
       RETURNING id, username, phone, email`,
      [NEW_PHONE]
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ ADMIN PHONE NUMBER UPDATED!');
    console.log('='.repeat(60));
    console.log('\n📋 Updated Admin Details:\n');
    console.log(`   ID:       ${result.id}`);
    console.log(`   Username: ${result.username}`);
    console.log(`   Phone:    ${result.phone}`);
    console.log(`   Email:    ${result.email}`);
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Admin can now login with:');
    console.log(`   Phone: ${result.phone}`);
    console.log(`   Username: ${result.username}`);
    console.log(`   Password: Admin@123`);
    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating admin phone:', error);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
updateAdminPhone();
