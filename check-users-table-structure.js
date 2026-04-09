// Quick script to check users table structure
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('\n📊 Checking users table structure...\n');
    
    // Get table columns
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check if there are any users
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\nTotal users in database: ${userCount.rows[0].count}`);
    
    // Show sample user (without sensitive data)
    const sampleUser = await client.query(`
      SELECT id, phone, email, full_name, user_type, is_active, created_at 
      FROM users 
      LIMIT 1
    `);
    
    if (sampleUser.rows.length > 0) {
      console.log('\nSample user:');
      console.log(sampleUser.rows[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersTable();
