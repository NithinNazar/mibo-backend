require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUserTypes() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking user_type constraint ===\n');
    
    const constraintResult = await client.query(`
      SELECT 
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'users_user_type_check'
    `);
    
    if (constraintResult.rows.length > 0) {
      console.log('Constraint definition:');
      console.log(constraintResult.rows[0].definition);
    }
    
    console.log('\n=== Existing user types in database ===\n');
    const usersResult = await client.query(`
      SELECT DISTINCT user_type, COUNT(*) as count
      FROM users
      GROUP BY user_type
    `);
    
    console.log('User types found:');
    usersResult.rows.forEach(row => {
      console.log(`  - ${row.user_type}: ${row.count} users`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserTypes();
