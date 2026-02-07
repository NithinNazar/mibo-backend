const pgp = require('pg-promise')();
require('dotenv').config();

async function deleteAllClinicians() {
  const db = pgp(process.env.DATABASE_URL);
  
  try {
    console.log('Starting deletion of all clinicians...\n');
    
    // Get count before deletion
    const beforeCount = await db.one('SELECT COUNT(*) as count FROM clinician_profiles');
    console.log(`Found ${beforeCount.count} clinicians to delete`);
    
    // Get user IDs associated with clinicians
    const userIds = await db.any('SELECT user_id FROM clinician_profiles');
    console.log(`Found ${userIds.length} associated user accounts`);
    
    // Delete in transaction
    await db.tx(async t => {
      // First delete availability rules
      await t.none('DELETE FROM clinician_availability_rules');
      console.log('✓ Deleted all availability rules');
      
      // Check for appointments
      const appointmentCount = await t.one('SELECT COUNT(*) as count FROM appointments WHERE clinician_id IN (SELECT id FROM clinician_profiles)');
      if (appointmentCount.count > 0) {
        console.log(`⚠️  Found ${appointmentCount.count} appointments - these will be deleted`);
        
        // Get appointment IDs
        const appointmentIds = await t.any('SELECT id FROM appointments WHERE clinician_id IN (SELECT id FROM clinician_profiles)');
        const aptIds = appointmentIds.map(a => a.id).join(',');
        
        if (aptIds) {
          // Delete payments first
          await t.none(`DELETE FROM payments WHERE appointment_id IN (${aptIds})`);
          console.log('✓ Deleted all associated payments');
          
          // Delete appointment status history
          await t.none(`DELETE FROM appointment_status_history WHERE appointment_id IN (${aptIds})`);
          console.log('✓ Deleted appointment status history');
          
          // Delete video sessions
          await t.none(`DELETE FROM video_sessions WHERE appointment_id IN (${aptIds})`);
          console.log('✓ Deleted video sessions');
        }
        
        // Now delete appointments
        await t.none('DELETE FROM appointments WHERE clinician_id IN (SELECT id FROM clinician_profiles)');
        console.log('✓ Deleted all associated appointments');
      }
      
      // Delete clinician profiles
      await t.none('DELETE FROM clinician_profiles');
      console.log('✓ Deleted all clinician profiles');
      
      // Delete staff profiles and users
      if (userIds.length > 0) {
        const ids = userIds.map(u => u.user_id).join(',');
        
        // Delete staff profiles
        await t.none(`DELETE FROM staff_profiles WHERE user_id IN (${ids})`);
        console.log('✓ Deleted all staff profiles');
        
        // Delete centre staff assignments
        await t.none(`DELETE FROM centre_staff_assignments WHERE user_id IN (${ids})`);
        console.log('✓ Deleted centre staff assignments');
        
        // Delete user roles
        await t.none(`DELETE FROM user_roles WHERE user_id IN (${ids})`);
        console.log('✓ Deleted all user roles');
        
        // Delete auth sessions
        await t.none(`DELETE FROM auth_sessions WHERE user_id IN (${ids})`);
        console.log('✓ Deleted auth sessions');
        
        // Delete users
        await t.none(`DELETE FROM users WHERE id IN (${ids})`);
        console.log('✓ Deleted all associated user accounts');
      }
    });
    
    // Verify deletion
    const afterCount = await db.one('SELECT COUNT(*) as count FROM clinician_profiles');
    console.log(`\nClinicians remaining: ${afterCount.count}`);
    
    console.log('\n✅ All clinicians deleted successfully!');
    console.log('Database is now ready for manual clinician entry from admin panel.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    pgp.end();
  }
}

deleteAllClinicians();
