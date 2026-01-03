/**
 * Create Admin User Script
 * 
 * This script creates a new admin user with proper bcrypt password hashing
 * 
 * Run: node create-admin.js
 */

const bcrypt = require('bcrypt');
const { db } = require('./dist/config/db');

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Admin@123',
  email: 'admin@mibo.com',
  phone: '919999999999',
  fullName: 'System Administrator',
};

async function createAdmin() {
  try {
    console.log('\n🔧 Creating Admin User...\n');

    // 1. Hash the password
    console.log('📝 Hashing password...');
    const passwordHash = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);
    console.log('✅ Password hashed successfully');

    // 2. Check if ADMIN role exists
    console.log('\n📝 Checking ADMIN role...');
    let adminRole = await db.oneOrNone('SELECT * FROM roles WHERE name = $1', ['ADMIN']);
    
    if (!adminRole) {
      console.log('Creating ADMIN role...');
      adminRole = await db.one(
        'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
        ['ADMIN', 'System Administrator with full access']
      );
      console.log('✅ ADMIN role created');
    } else {
      console.log('✅ ADMIN role already exists');
    }

    // 3. Delete existing admin user if exists
    console.log('\n📝 Checking for existing admin user...');
    const existingAdmin = await db.oneOrNone(
      'SELECT * FROM users WHERE username = $1',
      [ADMIN_CREDENTIALS.username]
    );

    if (existingAdmin) {
      console.log('⚠️  Existing admin found. Deleting...');
      
      // Delete user_roles
      await db.none('DELETE FROM user_roles WHERE user_id = $1', [existingAdmin.id]);
      
      // Delete staff_profiles
      await db.none('DELETE FROM staff_profiles WHERE user_id = $1', [existingAdmin.id]);
      
      // Delete user
      await db.none('DELETE FROM users WHERE id = $1', [existingAdmin.id]);
      
      console.log('✅ Existing admin deleted');
    }

    // 4. Create new admin user
    console.log('\n📝 Creating new admin user...');
    const newUser = await db.one(
      `INSERT INTO users (phone, email, username, password_hash, full_name, user_type, is_active)
       VALUES ($1, $2, $3, $4, $5, 'STAFF', true)
       RETURNING *`,
      [
        ADMIN_CREDENTIALS.phone,
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.username,
        passwordHash,
        ADMIN_CREDENTIALS.fullName,
      ]
    );
    console.log('✅ Admin user created');

    // 5. Create staff profile
    console.log('\n📝 Creating staff profile...');
    await db.one(
      `INSERT INTO staff_profiles (user_id, designation, is_active)
       VALUES ($1, $2, true)
       RETURNING *`,
      [newUser.id, 'System Administrator']
    );
    console.log('✅ Staff profile created');

    // 6. Assign ADMIN role
    console.log('\n📝 Assigning ADMIN role...');
    await db.one(
      `INSERT INTO user_roles (user_id, role_id, is_active)
       VALUES ($1, $2, true)
       RETURNING *`,
      [newUser.id, adminRole.id]
    );
    console.log('✅ ADMIN role assigned');

    // 7. Verify creation
    console.log('\n📝 Verifying admin user...');
    const verifyAdmin = await db.one(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        u.full_name,
        u.user_type,
        r.name as role,
        sp.designation,
        u.is_active
      FROM users u
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = $1`,
      [ADMIN_CREDENTIALS.username]
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ ADMIN USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 ADMIN CREDENTIALS (SAVE THESE!):\n');
    console.log(`   Username: ${ADMIN_CREDENTIALS.username}`);
    console.log(`   Password: ${ADMIN_CREDENTIALS.password}`);
    console.log(`   Email:    ${ADMIN_CREDENTIALS.email}`);
    console.log(`   Phone:    ${ADMIN_CREDENTIALS.phone}`);
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Admin Details:\n');
    console.log(`   ID:          ${verifyAdmin.id}`);
    console.log(`   Full Name:   ${verifyAdmin.full_name}`);
    console.log(`   Role:        ${verifyAdmin.role}`);
    console.log(`   Designation: ${verifyAdmin.designation}`);
    console.log(`   Active:      ${verifyAdmin.is_active}`);
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 You can now login to the admin panel with these credentials!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createAdmin();
