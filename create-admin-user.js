/**
 * Create Admin User Script
 * 
 * This script creates a new admin user with properly hashed password.
 * It uses the backend's bcrypt service to ensure password compatibility.
 * 
 * USAGE: node create-admin-user.js
 * 
 * Admin Credentials:
 * - Username: miboadmin
 * - Password: Mibo(2026)
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Admin user details
const ADMIN_USER = {
  full_name: 'Mibo Admin',
  phone: '+919083335090', // Admin phone number
  email: 'admin@mibo.care',
  user_type: 'STAFF',
  password: 'Mibo(2026)', // Will be hashed
};

// Staff profile details
const STAFF_PROFILE = {
  designation: 'ADMIN',
  is_active: true,
};

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Starting admin user creation...\n');

    // Start transaction
    await client.query('BEGIN');

    // 1. Hash the password using bcrypt (same as backend)
    console.log('🔒 Hashing password...');
    const SALT_ROUNDS = 10; // Same as backend
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, SALT_ROUNDS);
    console.log('✅ Password hashed successfully\n');

    // 2. Insert user into users table
    console.log('👤 Creating user account...');
    const userResult = await client.query(
      `INSERT INTO users (full_name, phone, email, password_hash, user_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, full_name, phone, email, user_type`,
      [
        ADMIN_USER.full_name,
        ADMIN_USER.phone,
        ADMIN_USER.email,
        hashedPassword,
        ADMIN_USER.user_type,
      ]
    );

    const user = userResult.rows[0];
    console.log('✅ User created:', {
      id: user.id,
      name: user.full_name,
      phone: user.phone,
      email: user.email,
      type: user.user_type,
    });
    console.log('');

    // 3. Insert staff profile
    console.log('👔 Creating staff profile...');
    const staffResult = await client.query(
      `INSERT INTO staff_profiles (user_id, designation, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, user_id, designation, is_active`,
      [user.id, STAFF_PROFILE.designation, STAFF_PROFILE.is_active]
    );

    const staff = staffResult.rows[0];
    console.log('✅ Staff profile created:', {
      id: staff.id,
      userId: staff.user_id,
      designation: staff.designation,
      isActive: staff.is_active,
    });
    console.log('');

    // Commit transaction
    await client.query('COMMIT');

    console.log('🎉 SUCCESS! Admin user created successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════');
    console.log('Username (phone): ${ADMIN_USER.phone}');
    console.log(`Password:         ${ADMIN_USER.password}`);
    console.log(`Email:            ${ADMIN_USER.email}`);
    console.log(`Designation:      ${STAFF_PROFILE.designation}`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('✅ You can now login to the admin panel with these credentials.');

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error creating admin user:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
