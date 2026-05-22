/**
 * Production Script: Assign Centres to Front Desk Staff
 * 
 * This script safely assigns centres to front desk staff users in production.
 * It provides a dry-run mode to preview changes before applying them.
 * 
 * Usage:
 *   node assign-centres-production.js --dry-run    # Preview changes
 *   node assign-centres-production.js --apply      # Apply changes
 */

const { db } = require('./dist/config/db');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isApply = args.includes('--apply');

if (!isDryRun && !isApply) {
  console.log('❌ ERROR: You must specify either --dry-run or --apply');
  console.log('');
  console.log('Usage:');
  console.log('  node assign-centres-production.js --dry-run    # Preview changes');
  console.log('  node assign-centres-production.js --apply      # Apply changes');
  process.exit(1);
}

/**
 * Manual mapping of front desk staff to centres
 * 
 * IMPORTANT: Update this mapping based on your production data
 * Format: { username: 'centre_city' }
 */
const STAFF_CENTRE_MAPPING = {
  // Example mappings - UPDATE THESE BASED ON YOUR PRODUCTION DATA
  // 'front999': 'kochi',
  // 'frontdesk_bangalore': 'bangalore',
  // 'frontdesk_mumbai': 'mumbai',
  
  // Add your production front desk staff here:
  // 'username': 'city',
};

async function assignCentresToFrontDesk() {
  try {
    console.log('='.repeat(60));
    console.log('ASSIGN CENTRES TO FRONT DESK STAFF');
    console.log('='.repeat(60));
    console.log('');
    
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
    } else {
      console.log('⚠️  APPLY MODE - Changes will be made to the database');
    }
    console.log('');
    
    // 1. Get all centres
    console.log('1. Available Centres:');
    const centres = await db.any('SELECT id, name, city FROM centres ORDER BY id');
    console.table(centres);
    
    // 2. Get all front desk staff
    console.log('\n2. Front Desk Staff Users:');
    const frontDeskUsers = await db.any(`
      SELECT 
        u.id,
        u.full_name,
        u.username,
        u.phone,
        ur.centre_id as current_centre_id,
        c.name as current_centre_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN centres c ON ur.centre_id = c.id
      WHERE r.name = 'FRONT_DESK'
        AND u.is_active = TRUE
        AND ur.is_active = TRUE
      ORDER BY u.id
    `);
    
    if (frontDeskUsers.length === 0) {
      console.log('✅ No front desk staff users found.');
      process.exit(0);
    }
    
    console.table(frontDeskUsers);
    
    // 3. Identify users without centres
    const usersWithoutCentres = frontDeskUsers.filter(u => !u.current_centre_id);
    
    console.log(`\n3. Users Without Centre Assignment: ${usersWithoutCentres.length}`);
    
    if (usersWithoutCentres.length === 0) {
      console.log('✅ All front desk staff already have centres assigned!');
      process.exit(0);
    }
    
    console.table(usersWithoutCentres.map(u => ({
      id: u.id,
      full_name: u.full_name,
      username: u.username,
    })));
    
    // 4. Check if mapping is configured
    if (Object.keys(STAFF_CENTRE_MAPPING).length === 0) {
      console.log('\n❌ ERROR: STAFF_CENTRE_MAPPING is empty!');
      console.log('');
      console.log('Please edit this script and add the mapping:');
      console.log('');
      console.log('const STAFF_CENTRE_MAPPING = {');
      usersWithoutCentres.forEach(u => {
        console.log(`  '${u.username}': 'bangalore', // or 'kochi' or 'mumbai'`);
      });
      console.log('};');
      console.log('');
      process.exit(1);
    }
    
    // 5. Plan assignments
    console.log('\n4. Planned Assignments:');
    const assignments = [];
    
    for (const user of usersWithoutCentres) {
      const targetCity = STAFF_CENTRE_MAPPING[user.username];
      
      if (!targetCity) {
        console.log(`⚠️  WARNING: No mapping found for user '${user.username}'`);
        continue;
      }
      
      const centre = centres.find(c => c.city.toLowerCase() === targetCity.toLowerCase());
      
      if (!centre) {
        console.log(`❌ ERROR: Centre not found for city '${targetCity}'`);
        continue;
      }
      
      assignments.push({
        user_id: user.id,
        username: user.username,
        full_name: user.full_name,
        centre_id: centre.id,
        centre_name: centre.name,
        centre_city: centre.city,
      });
    }
    
    if (assignments.length === 0) {
      console.log('❌ No valid assignments to make.');
      process.exit(1);
    }
    
    console.table(assignments);
    
    // 6. Apply or preview
    if (isDryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No changes made');
      console.log('');
      console.log('To apply these changes, run:');
      console.log('  node assign-centres-production.js --apply');
    } else {
      console.log('\n⚠️  Applying changes...');
      
      for (const assignment of assignments) {
        await db.none(`
          UPDATE user_roles
          SET centre_id = $1, updated_at = NOW()
          WHERE user_id = $2
            AND role_id = (SELECT id FROM roles WHERE name = 'FRONT_DESK')
        `, [assignment.centre_id, assignment.user_id]);
        
        console.log(`✅ Assigned ${assignment.centre_name} to ${assignment.full_name} (${assignment.username})`);
      }
      
      // 7. Verify
      console.log('\n5. Verification:');
      const verifyUsers = await db.any(`
        SELECT 
          u.id,
          u.full_name,
          u.username,
          ur.centre_id,
          c.name as centre_name,
          c.city
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        LEFT JOIN centres c ON ur.centre_id = c.id
        WHERE r.name = 'FRONT_DESK'
          AND u.is_active = TRUE
          AND ur.is_active = TRUE
        ORDER BY u.id
      `);
      
      console.table(verifyUsers);
      
      // Check for any remaining unassigned users
      const stillUnassigned = verifyUsers.filter(u => !u.centre_id);
      
      if (stillUnassigned.length > 0) {
        console.log('\n⚠️  WARNING: Some users still don\'t have centres assigned:');
        console.table(stillUnassigned);
      } else {
        console.log('\n✅ SUCCESS! All front desk staff now have centres assigned.');
      }
    }
    
    console.log('');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
assignCentresToFrontDesk();
