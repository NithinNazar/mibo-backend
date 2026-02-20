const { db } = require('./dist/config/db');

(async () => {
  try {
    console.log('\n=== DEBUGGING SLOTS API ISSUE ===\n');
    
    // 1. Check clinicians
    console.log('1. Checking clinicians in database:');
    const clinicians = await db.any(`
      SELECT cp.id, cp.user_id, u.full_name, cp.primary_centre_id
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.is_active = TRUE
    `);
    console.table(clinicians);
    
    if (clinicians.length === 0) {
      console.log('❌ No clinicians found!');
      process.exit(0);
    }
    
    const clinicianId = clinicians[0].id;
    console.log(`\n✓ Using clinician ID: ${clinicianId}`);
    
    // 2. Check availability rules
    console.log('\n2. Checking availability rules for this clinician:');
    const rules = await db.any(`
      SELECT *
      FROM clinician_availability_rules
      WHERE clinician_id = $1 AND is_active = TRUE
      ORDER BY day_of_week, start_time
    `, [clinicianId]);
    console.table(rules);
    
    if (rules.length === 0) {
      console.log('❌ No availability rules found for this clinician!');
    } else {
      console.log(`✓ Found ${rules.length} availability rules`);
      
      // 3. Test with a specific date
      const testDate = '2024-02-21'; // Wednesday
      const dateObj = new Date(testDate + 'T00:00:00Z');
      const dayOfWeek = dateObj.getUTCDay();
      
      console.log(`\n3. Testing with date: ${testDate} (day of week: ${dayOfWeek})`);
      
      const rulesForDay = rules.filter(r => r.day_of_week === dayOfWeek);
      console.log(`   Rules for this day: ${rulesForDay.length}`);
      if (rulesForDay.length > 0) {
        console.table(rulesForDay);
      } else {
        console.log('   ❌ No rules for this day of week!');
        console.log('   Available days:', rules.map(r => r.day_of_week).join(', '));
      }
    }
    
    // 4. Check the route registration
    console.log('\n4. Checking if route is registered:');
    console.log('   Expected route: GET /api/users/clinicians/:id/slots');
    console.log('   Test URL: http://localhost:5000/api/users/clinicians/1/slots?date=2024-02-21');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
