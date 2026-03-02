require('dotenv').config();
const pgp = require('pg-promise')();
const db = pgp(process.env.DATABASE_URL);

async function checkDurationField() {
  try {
    console.log('\n📋 Checking clinician_profiles table for duration field...\n');
    
    // Get column information
    const columns = await db.any(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'clinician_profiles'
      AND column_name LIKE '%duration%'
    `);
    
    console.log('Duration-related columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });
    
    if (columns.length === 0) {
      console.log('  ❌ No duration columns found!');
    }
    
    // Also check what a sample clinician record looks like
    const sample = await db.oneOrNone(`
      SELECT * FROM clinician_profiles LIMIT 1
    `);
    
    if (sample) {
      console.log('\n📄 Sample clinician record columns:');
      Object.keys(sample).forEach(key => {
        console.log(`  - ${key}: ${sample[key]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pgp.end();
  }
}

checkDurationField();
