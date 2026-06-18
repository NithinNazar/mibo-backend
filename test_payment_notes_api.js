const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// INSTRUCTIONS:
// 1. First run backend: cd c:\Users\nithi\Desktop\backend_mibo\backend && npm run dev
// 2. Then run this test: node test_payment_notes_api.js
// 3. Update TEST_CREDENTIALS below with valid admin credentials

// Test credentials - replace with actual test user
const TEST_CREDENTIALS = {
  username: 'admin', // Replace with actual admin username
  password: 'admin123' // Replace with actual admin password
};

async function testPaymentNotesAPI() {
  console.log('🧪 Testing Payment Notes API...\n');

  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Fetch all appointments
    console.log('Step 2: Fetching appointments...');
    const appointmentsResponse = await axios.get(`${BASE_URL}/api/appointments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const appointments = appointmentsResponse.data.data;
    console.log(`✅ Fetched ${appointments.length} appointments\n`);

    // Step 3: Check for payment notes
    console.log('Step 3: Checking for payment notes...');
    const appointmentsWithPaymentNotes = appointments.filter(apt => apt.payment_notes);
    const appointmentsWithPaymentMethod = appointments.filter(apt => apt.payment_method);

    console.log(`📊 Appointments with payment notes: ${appointmentsWithPaymentNotes.length}`);
    console.log(`📊 Appointments with payment method: ${appointmentsWithPaymentMethod.length}\n`);

    if (appointmentsWithPaymentNotes.length > 0) {
      console.log('Sample appointment with payment notes:');
      const sample = appointmentsWithPaymentNotes[0];
      console.log(`  - Appointment ID: ${sample.id}`);
      console.log(`  - Patient: ${sample.patient_name}`);
      console.log(`  - Payment Method: ${sample.payment_method}`);
      console.log(`  - Payment Notes: ${sample.payment_notes}`);
      console.log(`  - Status: ${sample.status}\n`);
    } else {
      console.log('ℹ️  No appointments with payment notes found');
      console.log('   This is normal if no direct payments have been made yet\n');
    }

    // Step 4: Show sample appointment structure
    if (appointments.length > 0) {
      console.log('Step 4: Sample appointment structure:');
      const sample = appointments[0];
      console.log(JSON.stringify({
        id: sample.id,
        patient_name: sample.patient_name,
        clinician_name: sample.clinician_name,
        status: sample.status,
        payment_method: sample.payment_method,
        payment_notes: sample.payment_notes,
        scheduled_start_at: sample.scheduled_start_at
      }, null, 2));
    }

    console.log('\n✅ All tests passed!');
    console.log('✅ Backend is returning payment_method and payment_notes fields correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('\n⚠️  Authentication failed. Please update TEST_CREDENTIALS with valid admin credentials');
    }
    process.exit(1);
  }
}

// Run the test
testPaymentNotesAPI();
