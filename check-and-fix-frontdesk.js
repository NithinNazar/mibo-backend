const { db } = require('./dist/config/db');

async function checkAndFixFrontDesk() {
  try {
    console.log('=== Checking Front Desk User ===\n');
    
    // 1. Check centres
    console.log('1. Available Centres:');
    const centres = await db.any('SELECT id, name, city FROM centres ORDER BY id');
    console.table(centres);
    
    // 2. Check front desk user
    console.log('\n2. Front Desk User Info:');
    const user = await db.oneOrNone(`
      SELECT 
        u.id, 
        u.full_name, 
        u.username,
        u.phone
      FROM users u
      WHERE u.username = 'front999'
    `);
    
    if (!user) {
      console.log('ERROR: User front999 not found!');
      process.exit(1);
    }
    
    console.table([user]);
    
    // 3. Check current centre assignments
    console.log('\n3. Current Centre Assignments:');
    const currentAssignments = await db.any(`
      SELECT 
        ur.user_id,
        ur.centre_id,
        c.name as centre_name,
        c.city
      FROM user_roles ur
      LEFT JOIN centres c ON ur.centre_id = c.id
      WHERE ur.user_id = $1 AND ur.centre_id IS NOT NULL
    `, [user.id]);
    
    if (currentAssignments.length === 0) {
      console.log('No centres assigned!');
    } else {
      console.table(currentAssignments);
    }
    
    // 4. Find Kochi centre
    const kochiCentre = centres.find(c => c.city.toLowerCase() === 'kochi');
    
    if (!kochiCentre) {
      console.log('\nERROR: Kochi centre not found!');
      process.exit(1);
    }
    
    console.log(`\n4. Kochi Centre ID: ${kochiCentre.id}`);
    
    // 5. Fix: Assign Kochi centre
    console.log('\n5. Assigning Kochi centre to front desk user...');
    
    // Update the user_roles table to set centre_id
    await db.none(`
      UPDATE user_roles
      SET centre_id = $1, updated_at = NOW()
      WHERE user_id = $2
    `, [kochiCentre.id, user.id]);
    console.log(`   - Assigned centre: ${kochiCentre.name} (ID: ${kochiCentre.id}) to user_roles`);
    
    // 6. Verify
    console.log('\n6. Verification - New Assignments:');
    const newAssignments = await db.any(`
      SELECT 
        ur.user_id,
        ur.centre_id,
        c.name as centre_name,
        c.city,
        r.name as role_name
      FROM user_roles ur
      LEFT JOIN centres c ON ur.centre_id = c.id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [user.id]);
    console.table(newAssignments);
    
    console.log('\n✅ SUCCESS! Front desk user now assigned to Kochi centre.');
    console.log('\nNext steps:');
    console.log('1. Logout from admin panel');
    console.log('2. Login again as front999');
    console.log('3. Check that only Kochi appointments and clinicians are shown');
    
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    process.exit(0);
  }
}

checkAndFixFrontDesk();
