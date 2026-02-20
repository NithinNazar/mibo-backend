const { db } = require('./dist/config/db');

(async () => {
  try {
    console.log('\n=== DEBUGGING FILTER ISSUE ===\n');
    
    const clinicianId = 48;
    const date = '2024-02-21';
    const centreId = 1;
    
    // Get clinician with availability rules
    const clinician = await db.one(`
      SELECT
        cp.*,
        u.full_name
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = $1 AND cp.is_active = TRUE
    `, [clinicianId]);
    
    console.log('Clinician:', clinician.full_name);
    console.log('Primary centre ID:', clinician.primary_centre_id, typeof clinician.primary_centre_id);
    
    // Get availability rules
    const rules = await db.any(`
      SELECT *
      FROM clinician_availability_rules
      WHERE clinician_id = $1 AND is_active = TRUE
      ORDER BY day_of_week, start_time
    `, [clinicianId]);
    
    console.log(`\nTotal rules: ${rules.length}`);
    
    // Calculate day of week
    const dateObj = new Date(date + 'T00:00:00Z');
    const dayOfWeek = dateObj.getUTCDay();
    console.log(`\nDate: ${date}`);
    console.log(`Day of week: ${dayOfWeek}`);
    
    // Filter rules
    console.log(`\nFiltering rules with centreId: ${centreId} (type: ${typeof centreId})`);
    
    const rulesForDay = rules.filter(rule => {
      console.log(`\n  Rule ${rule.id}:`);
      console.log(`    day_of_week: ${rule.day_of_week} === ${dayOfWeek}? ${rule.day_of_week === dayOfWeek}`);
      console.log(`    is_active: ${rule.is_active}`);
      console.log(`    centre_id: ${rule.centre_id} (type: ${typeof rule.centre_id})`);
      console.log(`    centre_id === centreId? ${rule.centre_id === centreId}`);
      console.log(`    centre_id == centreId? ${rule.centre_id == centreId}`);
      
      const matches = rule.day_of_week === dayOfWeek &&
                     rule.is_active &&
                     (!centreId || rule.centre_id === centreId);
      
      console.log(`    MATCHES: ${matches}`);
      return matches;
    });
    
    console.log(`\n✓ Rules after filtering: ${rulesForDay.length}`);
    
    if (rulesForDay.length > 0) {
      console.log('\nMatching rules:');
      console.table(rulesForDay.map(r => ({
        id: r.id,
        day: r.day_of_week,
        start: r.start_time,
        end: r.end_time,
        centre: r.centre_id
      })));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
