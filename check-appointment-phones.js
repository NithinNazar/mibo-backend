const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAppointmentPhones() {
  try {
    // Check recent appointments with phone numbers
    const query = `
      SELECT 
        a.id as appointment_id,
        a.scheduled_start_at,
        a.status,
        pu.full_name as patient_name,
        pu.phone as patient_phone,
        LENGTH(pu.phone) as patient_phone_length,
        su.full_name as clinician_name,
        su.phone as clinician_phone,
        LENGTH(su.phone) as clinician_phone_length
      FROM appointments a
      LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
      LEFT JOIN users pu ON pp.user_id = pu.id
      LEFT JOIN clinician_profiles cp ON a.clinician_id = cp.id
      LEFT JOIN users su ON cp.user_id = su.id
      ORDER BY a.id DESC
      LIMIT 10
    `;

    const result = await pool.query(query);

    console.log('\n=== Recent Appointments with Phone Numbers ===\n');
    
    if (result.rows.length === 0) {
      console.log('No appointments found in database.');
    } else {
      result.rows.forEach(row => {
        console.log(`Appointment ID: ${row.appointment_id}`);
        console.log(`Date/Time: ${row.scheduled_start_at} | Status: ${row.status}`);
        console.log(`Patient: ${row.patient_name} | Phone: ${row.patient_phone} (Length: ${row.patient_phone_length})`);
        console.log(`Clinician: ${row.clinician_name} | Phone: ${row.clinician_phone} (Length: ${row.clinician_phone_length})`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAppointmentPhones();
