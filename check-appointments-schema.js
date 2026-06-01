const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Check appointments table columns
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND column_name IN ('session_started_at', 'session_ended_at', 'status')
      ORDER BY ordinal_position
    `;
    
    const columnsResult = await client.query(columnsQuery);
    console.log('=== APPOINTMENTS TABLE COLUMNS ===');
    console.log(JSON.stringify(columnsResult.rows, null, 2));
    console.log('');
    
    // Check for any constraints
    const constraintsQuery = `
      SELECT 
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'appointments'
      ORDER BY con.conname
    `;
    
    const constraintsResult = await client.query(constraintsQuery);
    console.log('=== APPOINTMENTS TABLE CONSTRAINTS ===');
    console.log(JSON.stringify(constraintsResult.rows, null, 2));
    console.log('');
    
    // Check a sample appointment
    const sampleQuery = `
      SELECT 
        id,
        status,
        scheduled_start_at,
        session_started_at,
        session_ended_at,
        created_at,
        updated_at
      FROM appointments
      WHERE status = 'CONFIRMED'
      ORDER BY scheduled_start_at DESC
      LIMIT 3
    `;
    
    const sampleResult = await client.query(sampleQuery);
    console.log('=== SAMPLE CONFIRMED APPOINTMENTS ===');
    console.log(JSON.stringify(sampleResult.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkSchema();
