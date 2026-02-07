const pgp = require('pg-promise')();
require('dotenv').config();

async function listClinicians() {
  const db = pgp(process.env.DATABASE_URL);
  
  try {
    const clinicians = await db.any(`
      SELECT 
        cp.id,
        u.full_name,
        u.phone,
        c.name as centre_name,
        cp.specialization,
        cp.created_at
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON cp.primary_centre_id = c.id
      ORDER BY cp.id
    `);
    
    console.log(`Total clinicians in database: ${clinicians.length}\n`);
    console.log('List of all clinicians:');
    console.log('='.repeat(80));
    
    clinicians.forEach((c, index) => {
      console.log(`${index + 1}. ${c.full_name}`);
      console.log(`   Phone: ${c.phone}`);
      console.log(`   Centre: ${c.centre_name}`);
      console.log(`   Specialization: ${JSON.stringify(c.specialization)}`);
      console.log(`   Created: ${c.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pgp.end();
  }
}

listClinicians();
