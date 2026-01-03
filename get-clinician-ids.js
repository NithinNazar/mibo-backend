const { db } = require('./dist/config/db');

async function getClinicians() {
  try {
    const clinicians = await db.any(`
      SELECT 
        cp.id as clinician_id,
        u.id as user_id,
        u.full_name,
        cp.primary_centre_id as centre_id,
        c.name as centre_name,
        cp.is_active
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON cp.primary_centre_id = c.id
      WHERE cp.is_active = true
      ORDER BY cp.primary_centre_id, u.id
      LIMIT 10
    `);

    console.log('\n=== CLINICIANS IN DATABASE ===\n');
    clinicians.forEach(c => {
      console.log(`Clinician ID: ${c.clinician_id}, User ID: ${c.user_id}`);
      console.log(`Name: ${c.full_name}`);
      console.log(`Centre ID: ${c.centre_id}, Centre: ${c.centre_name}`);
      console.log(`Active: ${c.is_active}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getClinicians();
