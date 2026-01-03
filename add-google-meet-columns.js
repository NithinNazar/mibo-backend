// add-google-meet-columns.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addGoogleMeetColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding Google Meet columns to appointments table...');

    // Add google_meet_link column
    await client.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS google_meet_link VARCHAR(500)
    `);
    console.log('✅ Added google_meet_link column');

    // Add google_meet_event_id column
    await client.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS google_meet_event_id VARCHAR(255)
    `);
    console.log('✅ Added google_meet_event_id column');

    // Add index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_google_meet_event_id 
      ON appointments(google_meet_event_id)
    `);
    console.log('✅ Added index on google_meet_event_id');

    console.log('✅ Google Meet columns added successfully!');
  } catch (error) {
    console.error('❌ Error adding Google Meet columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addGoogleMeetColumns()
  .then(() => {
    console.log('✅ Database migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
