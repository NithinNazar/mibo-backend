// Check appointment and payment details
const { db } = require('./dist/config/db');

async function checkAppointmentPayment() {
  try {
    const appointmentId = 9; // Most recent ONLINE appointment
    
    console.log(`🔍 Checking appointment #${appointmentId}...\n`);
    
    // Get appointment details
    const appointment = await db.oneOrNone(`
      SELECT 
        a.*,
        u.full_name as clinician_name,
        c.name as centre_name,
        pu.full_name as patient_name,
        pu.phone as patient_phone
      FROM appointments a
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON a.centre_id = c.id
      JOIN patient_profiles pp ON a.patient_id = pp.id
      JOIN users pu ON pp.user_id = pu.id
      WHERE a.id = $1
    `, [appointmentId]);
    
    if (!appointment) {
      console.log('❌ Appointment not found');
      process.exit(1);
    }
    
    console.log('📋 Appointment Details:');
    console.log(`   ID: ${appointment.id}`);
    console.log(`   Type: ${appointment.appointment_type}`);
    console.log(`   Status: ${appointment.status}`);
    console.log(`   Patient: ${appointment.patient_name} (${appointment.patient_phone})`);
    console.log(`   Clinician: ${appointment.clinician_name}`);
    console.log(`   Centre: ${appointment.centre_name}`);
    console.log(`   Scheduled: ${appointment.scheduled_start_at}`);
    console.log(`   Google Meet Link: ${appointment.google_meet_link || 'None'}`);
    console.log(`   Event ID: ${appointment.google_meet_event_id || 'None'}`);
    
    // Check payment
    const payment = await db.oneOrNone(`
      SELECT * FROM payments 
      WHERE appointment_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [appointmentId]);
    
    console.log('\n💳 Payment Details:');
    if (payment) {
      console.log(`   Order ID: ${payment.order_id}`);
      console.log(`   Payment ID: ${payment.payment_id || 'Not paid'}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: ₹${payment.amount}`);
      console.log(`   Created: ${payment.created_at}`);
      console.log(`   Paid At: ${payment.paid_at || 'Not paid'}`);
    } else {
      console.log('   ❌ No payment record found');
    }
    
    console.log('\n📊 Analysis:');
    if (appointment.status !== 'CONFIRMED') {
      console.log(`   ⚠️  Appointment status is "${appointment.status}", not "CONFIRMED"`);
      console.log('   Google Meet link is only created when payment is verified');
      console.log('   and appointment status changes to CONFIRMED');
    }
    
    if (!payment || payment.status !== 'SUCCESS') {
      console.log('   ⚠️  Payment not completed or not successful');
      console.log('   Complete the payment to trigger Google Meet link creation');
    }
    
    if (appointment.appointment_type === 'ONLINE' && appointment.status === 'CONFIRMED' && !appointment.google_meet_link) {
      console.log('   ❌ ISSUE: ONLINE appointment is CONFIRMED but no Google Meet link!');
      console.log('   This indicates the Google Meet creation failed during payment verification');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAppointmentPayment();
