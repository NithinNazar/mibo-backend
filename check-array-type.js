const pgp = require('pg-promise')();
require('dotenv').config();

async function checkArrayType() {
  const db = pgp(process.env.DATABASE_URL);
  
  try {
    const data = await db.any(`
      SELECT 
        id,
        specialization,
        jsonb_typeof(specialization) as spec_type,
        qualification,
        jsonb_typeof(qualification) as qual_type
      FROM clinician_profiles
      LIMIT 5
    `);
    
    console.log('Clinician data types:\n');
    data.forEach(row => {
      console.log(`ID ${row.id}:`);
      console.log(`  Specialization: ${JSON.stringify(row.specialization)} (type: ${row.spec_type})`);
      console.log(`  Qualification: ${JSON.stringify(row.qualification)} (type: ${row.qual_type})`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pgp.end();
  }
}

checkArrayType();
