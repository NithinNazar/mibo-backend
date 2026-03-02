const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    // Check staff_profiles table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'staff_profiles'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 staff_profiles table columns:');
    console.log('═══════════════════════════════════════════════════');
    result.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
    });
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
