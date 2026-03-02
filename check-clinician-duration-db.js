// Check database directly for clinician duration values
require('dotenv').config();
const { db } = require('./dist/config/db');

async function checkDurationInDB() {
  try {
    console.log('🔍 Checking clinician duration values in database...\n');

    const clinicians = await db.any(`
      SELECT 
        cp.id,
        cp.user_id,
        u.full_name,
        cp.default_consultation_duration_minutes,
        cp.consultation_fee,
        cp.is_active
      FROM clinician_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.is_active = TRUE
      ORDER BY cp.id
    `);

    if (clinicians.length === 0) {
      console.log('❌ No active clinicians found in database');
      return;
    }

    console.log(`✅ Found ${clinicians.length} active clinician(s)\n`);

    clinicians.forEach((clinician, index) => {
      console.log(`\n--- Clinician ${index + 1} ---`);
      console.log(`ID: ${clinician.id}`);
      console.log(`User ID: ${clinician.user_id}`);
      console.log(`Name: ${clinician.full_name}`);
      console.log(`Consultation Fee: ₹${clinician.consultation_fee || 'NULL'}`);
      console.log(`Duration (DB column): ${clinician.default_consultation_duration_minutes || 'NULL'} minutes`);
      
      if (clinician.default_consultation_duration_minutes === null || clinician.default_consultation_duration_minutes === undefined) {
        console.log(`⚠️  WARNING: Duration is NULL in database!`);
      } else if (clinician.default_consultation_duration_minutes === 50) {
        console.log(`⚠️  Duration is still default 50 minutes`);
      } else {
        console.log(`✅ Duration is set to custom value`);
      }
    });

    console.log('\n\n📊 Summary:');
    const nullDurations = clinicians.filter(c => !c.default_consultation_duration_minutes);
    const defaultDurations = clinicians.filter(c => c.default_consultation_duration_minutes === 50);
    const customDurations = clinicians.filter(c => c.default_consultation_duration_minutes && c.default_consultation_duration_minutes !== 50);

    console.log(`Clinicians with NULL duration: ${nullDurations.length}`);
    console.log(`Clinicians with default 50 mins: ${defaultDurations.length}`);
    console.log(`Clinicians with custom duration: ${customDurations.length}`);

    if (customDurations.length > 0) {
      console.log('\nCustom durations:');
      customDurations.forEach(c => {
        console.log(`  - ${c.full_name}: ${c.default_consultation_duration_minutes} mins`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDurationInDB();
