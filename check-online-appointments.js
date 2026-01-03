// Check online appointments in database
const { db } = require('./dist/config/db');

async function checkAppointments() {
  try {
    console.log('🔍 Checking recent appointments...\n');
    
    const appointments = await db.any(`
      SELECT 
        id,
        appointment_type,
        google_meet_link,
        google_meet_event_id,
        status,
        scheduled_start_at,
        created_at
      FROM appointments 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${appointments.length} appointments:\n`);
    
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. Appointment #${apt.id}`);
      console.log(`   Type: ${apt.appointment_type}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Google Meet Link: ${apt.google_meet_link || 'None'}`);
      console.log(`   Event ID: ${apt.google_meet_event_id || 'None'}`);
      console.log(`   Scheduled: ${apt.scheduled_start_at}`);
      console.log(`   Created: ${apt.created_at}`);
      console.log('');
    });
    
    // Check for ONLINE appointments specifically
    const onlineAppointments = appointments.filter(a => a.appointment_type === 'ONLINE');
    console.log(`\n📊 Summary:`);
    console.log(`   Total appointments: ${appointments.length}`);
    console.log(`   ONLINE appointments: ${onlineAppointments.length}`);
    console.log(`   With Google Meet links: ${appointments.filter(a => a.google_meet_link).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAppointments();
