const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'patient_profiles'
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== PATIENT_PROFILES TABLE SCHEMA ===\n');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
