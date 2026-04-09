// Script to create test user with username and password on AWS database
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// AWS RDS connection
const pool = new Pool({
  connectionString: 'postgresql://mibo_admin:mibo%23aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestUser() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔐 Creating test user on AWS database...\n');
    
    const username = 'testuser123';
    const password = 'test@789';
    const email = 'testuser123@mibocare.com';
    const fullName = 'Test User for Razorpay';
    const phone = '919111111111'; // Unique phone number for test user
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE username = $1 OR phone = $2',
      [username, phone]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('❌ User already exists with this username or phone!');
      console.log('Existing user:', existingUser.rows[0]);
      console.log('\n✅ Test user is already set up on AWS!');
      console.log('\n📋 TEST CREDENTIALS FOR RAZORPAY:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Username: testuser123');
      console.log('  Password: test@789');
      console.log('  Email: testuser123@mibocare.com');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await client.query(
      `INSERT INTO users (username, password_hash, phone, email, full_name, user_type, is_active)
       VALUES ($1, $2, $3, $4, $5, 'PATIENT', true)
       RETURNING id, username, email, full_name, phone, user_type, created_at`,
      [username, passwordHash, phone, email, fullName]
    );
    
    const newUser = result.rows[0];
    console.log('✅ Test user created successfully on AWS!\n');
    console.log('User Details:');
    console.log('  ID:', newUser.id);
    console.log('  Username:', newUser.username);
    console.log('  Email:', newUser.email);
    console.log('  Full Name:', newUser.full_name);
    console.log('  Phone:', newUser.phone);
    console.log('  User Type:', newUser.user_type);
    console.log('  Created At:', newUser.created_at);
    
    // Create patient profile
    const patientProfile = await client.query(
      `INSERT INTO patient_profiles (user_id, is_active)
       VALUES ($1, true)
       RETURNING id`,
      [newUser.id]
    );
    
    console.log('\n✅ Patient profile created on AWS!');
    console.log('  Patient Profile ID:', patientProfile.rows[0].id);
    
    console.log('\n📋 TEST CREDENTIALS FOR RAZORPAY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Username: testuser123');
    console.log('  Password: test@789');
    console.log('  Email: testuser123@mibocare.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUser();
