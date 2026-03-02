require('dotenv').config();
const pgp = require('pg-promise')();

const db = pgp(process.env.DATABASE_URL);

async function listClinicians() {
  try {
    console.log('\n📋 Fetching all clinicians...\n');
    
    const clinicians = await db.any(`
      SELECT 
        sp.id,
        sp.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        sp.specialization,
        sp.experience_years,
        sp.consultation_fee,
        sp.is_active,
        sp.created_at
      FROM staff_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.role = 'clinician'
      ORDER BY sp.created_at DESC
    `);
    
    if (clinicians.length === 0) {
      console.log('❌ No clinicians found in the database.');
      return [];
    }
    
    console.log(`✅ Found ${clinicians.length} clinician(s):\n`);
    clinicians.forEach((clinician, index) => {
      console.log(`${index + 1}. ID: ${clinician.id}`);
      console.log(`   Name: ${clinician.full_name}`);
      console.log(`   Email: ${clinician.email}`);
      console.log(`   Phone: ${clinician.phone_number}`);
      console.log(`   Specialization: ${clinician.specialization}`);
      console.log(`   Experience: ${clinician.experience_years} years`);
      console.log(`   Fee: ₹${clinician.consultation_fee}`);
      console.log(`   Status: ${clinician.is_active ? 'Active' : 'Inactive'}`);
      console.log(`   Created: ${clinician.created_at}`);
      console.log('');
    });
    
    return clinicians;
  } catch (error) {
    console.error('❌ Error fetching clinicians:', error.message);
    throw error;
  }
}

async function deleteClinicians() {
  try {
    const clinicians = await listClinicians();
    
    if (clinicians.length === 0) {
      console.log('No clinicians to delete.');
      return;
    }
    
    console.log('⚠️  WARNING: This will delete ALL clinicians and their related data!');
    console.log('⚠️  This includes:');
    console.log('   - Staff profiles');
    console.log('   - User accounts');
    console.log('   - Availability schedules');
    console.log('   - Any other related data\n');
    
    // Delete in transaction to ensure data integrity
    await db.tx(async t => {
      for (const clinician of clinicians) {
        console.log(`🗑️  Deleting clinician: ${clinician.full_name} (ID: ${clinician.id})...`);
        
        // Delete availability schedules
        await t.none(`
          DELETE FROM clinician_availability 
          WHERE clinician_id = $1
        `, [clinician.id]);
        
        // Delete staff profile
        await t.none(`
          DELETE FROM staff_profiles 
          WHERE id = $1
        `, [clinician.id]);
        
        // Delete user account
        await t.none(`
          DELETE FROM users 
          WHERE id = $1
        `, [clinician.user_id]);
        
        console.log(`   ✅ Deleted successfully`);
      }
    });
    
    console.log(`\n✅ Successfully deleted ${clinicians.length} clinician(s)!`);
    console.log('✅ All related data has been removed from the database.\n');
    
  } catch (error) {
    console.error('\n❌ Error deleting clinicians:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    pgp.end();
  }
}

// Run the deletion
deleteClinicians()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
