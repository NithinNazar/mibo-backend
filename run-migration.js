// Quick script to run migration
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://postgres:g20m340i@localhost:5432/mibo-development-db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_patient_notes_to_appointments.sql'),
      'utf8'
    );

    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully');
    console.log('✅ Added patient_notes column to appointments table');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
