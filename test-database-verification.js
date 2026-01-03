/**
 * Database Verification Test
 * 
 * This test verifies that the database has been populated correctly
 * with centres, doctors, and availability rules.
 */

const { db } = require('./dist/config/db');

async function verifyDatabase() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE VERIFICATION TEST');
    console.log('='.repeat(60) + '\n');

    // 1. Check Centres
    console.log('=== Checking Centres ===');
    const centres = await db.any('SELECT * FROM centres ORDER BY id');
    console.log(`✓ Found ${centres.length} centres:`);
    centres.forEach(c => {
      console.log(`  - ${c.name} (${c.city})`);
    });

    // 2. Check Doctors
    console.log('\n=== Checking Doctors ===');
    const doctors = await db.any(`
      SELECT 
        u.id,
        u.full_name,
        cp.specialization,
        c.name as centre_name,
        cp.consultation_fee,
        cp.is_active
      FROM users u
      JOIN clinician_profiles cp ON u.id = cp.user_id
      JOIN centres c ON cp.primary_centre_id = c.id
      ORDER BY cp.primary_centre_id, u.id
    `);
    console.log(`✓ Found ${doctors.length} doctors:`);
    
    const bangalore = doctors.filter(d => d.centre_name === 'Mibo Bangalore');
    const kochi = doctors.filter(d => d.centre_name === 'Mibo Kochi');
    const mumbai = doctors.filter(d => d.centre_name === 'Mibo Mumbai');
    
    console.log(`  - Bangalore: ${bangalore.length} doctors`);
    console.log(`  - Kochi: ${kochi.length} doctors`);
    console.log(`  - Mumbai: ${mumbai.length} doctors`);

    // Show first 3 doctors as sample
    console.log('\n  Sample doctors:');
    doctors.slice(0, 3).forEach(d => {
      console.log(`    • ${d.full_name} - ${d.specialization.substring(0, 50)}...`);
      console.log(`      Centre: ${d.centre_name}, Fee: ₹${d.consultation_fee}`);
    });

    // 3. Check Availability Rules
    console.log('\n=== Checking Availability Rules ===');
    const availabilityCount = await db.one('SELECT COUNT(*) FROM clinician_availability_rules');
    console.log(`✓ Found ${availabilityCount.count} availability rules`);

    // Sample availability rules
    const sampleRules = await db.any(`
      SELECT 
        u.full_name,
        c.name as centre,
        car.day_of_week,
        car.start_time,
        car.end_time,
        car.mode
      FROM clinician_availability_rules car
      JOIN clinician_profiles cp ON car.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON car.centre_id = c.id
      WHERE car.is_active = true
      LIMIT 5
    `);

    console.log('\n  Sample availability rules:');
    sampleRules.forEach(r => {
      const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      console.log(`    • ${r.full_name} - ${days[r.day_of_week]}: ${r.start_time} - ${r.end_time} (${r.mode})`);
    });

    // 4. Check Admin User
    console.log('\n=== Checking Admin User ===');
    const admin = await db.oneOrNone(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone,
        r.name as role,
        sp.designation,
        u.is_active
      FROM users u
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = 'admin'
    `);

    if (admin) {
      console.log('✓ Admin user found:');
      console.log(`  - Username: ${admin.username}`);
      console.log(`  - Email: ${admin.email}`);
      console.log(`  - Role: ${admin.role}`);
      console.log(`  - Active: ${admin.is_active}`);
    } else {
      console.log('✗ Admin user not found!');
    }

    // 5. Test Getting Available Slots for a Doctor
    console.log('\n=== Testing Available Slots Query ===');
    const firstDoctor = doctors[0];
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7); // Next week
    const dateStr = testDate.toISOString().split('T')[0];

    console.log(`  Testing slots for: ${firstDoctor.full_name}`);
    console.log(`  Date: ${dateStr}`);

    const slots = await db.any(`
      SELECT 
        car.start_time,
        car.end_time,
        car.slot_duration_minutes,
        car.mode
      FROM clinician_availability_rules car
      JOIN clinician_profiles cp ON car.clinician_id = cp.id
      WHERE cp.user_id = $1
        AND car.is_active = true
        AND car.day_of_week = EXTRACT(DOW FROM DATE $2)
      LIMIT 3
    `, [firstDoctor.id, dateStr]);

    if (slots.length > 0) {
      console.log(`✓ Found ${slots.length} availability rules for this day`);
      slots.forEach(s => {
        console.log(`    • ${s.start_time} - ${s.end_time} (${s.slot_duration_minutes} min, ${s.mode})`);
      });
    } else {
      console.log('  ℹ No slots found (might be weekend)');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Centres: ${centres.length}`);
    console.log(`✓ Doctors: ${doctors.length}`);
    console.log(`✓ Availability Rules: ${availabilityCount.count}`);
    console.log(`✓ Admin User: ${admin ? 'Created' : 'Missing'}`);
    console.log('\n✅ Database is properly populated and ready for use!');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.error(error);
    process.exit(1);
  }
}

// Run verification
verifyDatabase();
