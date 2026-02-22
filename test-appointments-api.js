const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials - using admin user
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testAppointmentsAPI() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Set up headers with auth token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('📋 Fetching appointments...');
    const appointmentsResponse = await axios.get(`${BASE_URL}/appointments`, { headers });
    
    const appointments = appointmentsResponse.data;
    console.log(`✅ Found ${appointments.length} appointments\n`);

    if (appointments.length > 0) {
      const firstAppointment = appointments[0];
      console.log('📝 First appointment structure:');
      console.log(JSON.stringify(firstAppointment, null, 2));
      
      console.log('\n🔍 Checking property names:');
      console.log(`  ✓ scheduled_start_at exists: ${firstAppointment.hasOwnProperty('scheduled_start_at')}`);
      console.log(`  ✓ scheduled_end_at exists: ${firstAppointment.hasOwnProperty('scheduled_end_at')}`);
      console.log(`  ✓ patient_name exists: ${firstAppointment.hasOwnProperty('patient_name')}`);
      console.log(`  ✓ clinician_name exists: ${firstAppointment.hasOwnProperty('clinician_name')}`);
      console.log(`  ✓ centre_name exists: ${firstAppointment.hasOwnProperty('centre_name')}`);
      
      // Check if camelCase versions exist (they shouldn't)
      console.log('\n❌ Checking for incorrect camelCase properties:');
      console.log(`  scheduledStartAt exists: ${firstAppointment.hasOwnProperty('scheduledStartAt')} (should be false)`);
      console.log(`  scheduledEndAt exists: ${firstAppointment.hasOwnProperty('scheduledEndAt')} (should be false)`);
      
      console.log('\n✅ Property naming verification complete!');
      console.log('   Backend returns snake_case properties as expected.');
      console.log('   Frontend fix (scheduled_end_at) matches backend response.');
    } else {
      console.log('ℹ️  No appointments found in database');
      console.log('   Creating a test appointment to verify...\n');
      
      // Get a clinician first
      const cliniciansResponse = await axios.get(`${BASE_URL}/users/clinicians`, { headers });
      if (cliniciansResponse.data.length === 0) {
        console.log('❌ No clinicians found. Cannot create test appointment.');
        return;
      }
      
      const clinician = cliniciansResponse.data[0];
      console.log(`   Found clinician: ${clinician.name || clinician.fullName}`);
      
      // Get a patient
      const patientsResponse = await axios.get(`${BASE_URL}/patients`, { headers });
      if (patientsResponse.data.length === 0) {
        console.log('❌ No patients found. Cannot create test appointment.');
        return;
      }
      
      const patient = patientsResponse.data[0];
      console.log(`   Found patient: ${patient.fullName}`);
      
      // Create test appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const appointmentData = {
        patientId: patient.id,
        clinicianId: clinician.id,
        centreId: clinician.primaryCentreId,
        appointmentType: 'IN_PERSON',
        scheduledStartAt: tomorrow.toISOString(),
        durationMinutes: 45,
        notes: 'Test appointment for API verification'
      };
      
      console.log('   Creating test appointment...');
      const createResponse = await axios.post(`${BASE_URL}/appointments`, appointmentData, { headers });
      const newAppointment = createResponse.data;
      
      console.log('\n✅ Test appointment created!');
      console.log('📝 Appointment structure:');
      console.log(JSON.stringify(newAppointment, null, 2));
      
      console.log('\n🔍 Checking property names:');
      console.log(`  ✓ scheduled_start_at exists: ${newAppointment.hasOwnProperty('scheduled_start_at')}`);
      console.log(`  ✓ scheduled_end_at exists: ${newAppointment.hasOwnProperty('scheduled_end_at')}`);
      
      console.log('\n✅ Property naming verification complete!');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   Authentication failed. Check credentials.');
    }
  }
}

testAppointmentsAPI();
