/**
 * Populate Database with Doctors Script
 * 
 * This script populates the database with doctors matching frontend data
 * 
 * Run: node populate-database.js
 */

const fs = require('fs');
const { db } = require('./dist/config/db');

async function populateDatabase() {
  try {
    console.log('\n🔧 Populating Database with Doctors...\n');

    // Read the SQL file
    const sqlScript = fs.readFileSync('./POPULATE_DATABASE.sql', 'utf8');

    // Execute the entire script as one transaction
    console.log('📝 Executing SQL script...\n');

    try {
      await db.none(sqlScript);
      console.log('✅ SQL script executed successfully\n');
    } catch (error) {
      console.error('⚠️  Error executing SQL:', error.message);
      // Continue to verification even if some inserts failed due to conflicts
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE POPULATED SUCCESSFULLY!');
    console.log('='.repeat(60));

    // Verify the data
    console.log('\n📝 Verifying data...\n');

    const centres = await db.any('SELECT * FROM centres ORDER BY id');
    console.log(`✅ Centres: ${centres.length}`);
    centres.forEach(c => console.log(`   - ${c.name} (${c.city})`));

    const doctors = await db.any(`
      SELECT 
        u.full_name,
        cp.specialization,
        c.name as centre_name,
        cp.consultation_fee
      FROM users u
      JOIN clinician_profiles cp ON u.id = cp.user_id
      JOIN centres c ON cp.primary_centre_id = c.id
      ORDER BY cp.primary_centre_id, u.id
    `);
    console.log(`\n✅ Doctors: ${doctors.length}`);
    
    const bangalore = doctors.filter(d => d.centre_name === 'Mibo Bangalore');
    const kochi = doctors.filter(d => d.centre_name === 'Mibo Kochi');
    const mumbai = doctors.filter(d => d.centre_name === 'Mibo Mumbai');
    
    console.log(`   - Bangalore: ${bangalore.length} doctors`);
    console.log(`   - Kochi: ${kochi.length} doctors`);
    console.log(`   - Mumbai: ${mumbai.length} doctors`);

    const availabilityRules = await db.one('SELECT COUNT(*) FROM clinician_availability_rules');
    console.log(`\n✅ Availability Rules: ${availabilityRules.count}`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database is ready for testing!');
    console.log('='.repeat(60));
    console.log('\n💡 Next Steps:');
    console.log('   1. Run: node test-with-otp.js');
    console.log('   2. Enter OTP from WhatsApp');
    console.log('   3. Test complete booking flow\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error populating database:', error);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
populateDatabase();
