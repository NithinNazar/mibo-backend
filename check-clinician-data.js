const pgp = require('pg-promise')();
require('dotenv').config();

async function checkData() {
  const db = pgp(process.env.DATABASE_URL);
  
  try {
    console.log('Checking clinician_profiles table...\n');
    
    // Check current columns
    const columns = await db.any(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clinician_profiles'
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if there's any data
    const count = await db.one('SELECT COUNT(*) as count FROM clinician_profiles');
    console.log(`\nTotal clinicians: ${count.count}`);
    
    if (count.count > 0) {
      // Check specialization data
      const specs = await db.any('SELECT id, specialization FROM clinician_profiles LIMIT 5');
      console.log('\nSample specialization data:');
      specs.forEach(s => {
        console.log(`  ID ${s.id}: "${s.specialization}" (type: ${typeof s.specialization})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pgp.end();
  }
}

checkData();
