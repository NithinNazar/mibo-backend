require('dotenv').config();
const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('=== CHECKING staff_profiles TABLE SCHEMA ===\n');

    // Check staff_profiles columns
    const staffProfilesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'staff_profiles'
      ORDER BY ordinal_position;
    `);

    console.log('staff_profiles columns:');
    staffProfilesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check clinician_profiles columns
    console.log('\n=== CHECKING clinician_profiles TABLE SCHEMA ===\n');
    const clinicianProfilesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clinician_profiles'
      ORDER BY ordinal_position;
    `);

    console.log('clinician_profiles columns:');
    clinicianProfilesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check clinician_availability_rules columns
    console.log('\n=== CHECKING clinician_availability_rules TABLE SCHEMA ===\n');
    const availabilityColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clinician_availability_rules'
      ORDER BY ordinal_position;
    `);

    console.log('clinician_availability_rules columns:');
    availabilityColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if there's data in clinician_profiles
    console.log('\n=== CHECKING EXISTING DATA ===\n');
    const clinicians = await client.query('SELECT * FROM clinician_profiles LIMIT 5');
    console.log(`Found ${clinicians.rows.length} clinicians in clinician_profiles`);
    if (clinicians.rows.length > 0) {
      console.log('Sample clinician:', JSON.stringify(clinicians.rows[0], null, 2));
    }

    // Check availability rules
    const availability = await client.query('SELECT * FROM clinician_availability_rules LIMIT 5');
    console.log(`\nFound ${availability.rows.length} availability rules in clinician_availability_rules`);
    if (availability.rows.length > 0) {
      console.log('Sample availability rule:', JSON.stringify(availability.rows[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
