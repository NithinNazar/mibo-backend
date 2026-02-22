const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials - using admin user
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testAppointmentCreation() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get a clinician
    console.log('👨‍⚕️ Fetching clinicians...');
    const cliniciansResponse = await axios.get(`${BASE_URL}/users/clinicians`, { headers });
    if (cliniciansResponse.data.length === 0) {
      console.log('❌ No clinicians found');
      return;
    }
    const clinician = cliniciansResponse.data[0];
    console.log(`✅ Found clinician: ${clinician.name || clinician.fullName} (ID: ${clinician.id})`);

    // Get a patient
    console.log('\n👤 Fetching patients...');
    const patientsResponse = await axios.get(`${BASE_URL}/patients`, { headers });
    if (patientsResponse.data.length === 0) {
      console.log('❌ No patients found');
      return;
    }
    const patient = patientsResponse.data[0];
    console.log(`✅ Found patient: ${patient.fullName} (ID: ${patient.id})`);

    // Get slots for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`\n📅 Fetching slots for ${dateStr}...`);
    const slotsResponse = await axios.get(`${BASE_URL}/users/clinicians/${clinician.id}/slots`, {
      headers,
      params: {
        date: dateStr,
        centreId: clinician.primaryCentreId
      }
    });

    const slots = slotsResponse.data;
    console.log(`✅ Found ${slots.length} slots`);

    if (slots.length === 0) {
      console.log('❌ No available slots found');
      return;
    }

    // Find first available slot
    const availableSlot = slots.find(s => s.status === 'available');
    if (!availableSlot) {
      console.log('❌ No available slots found');
      return;
    }

    console.log(`✅ Selected slot: ${availableSlot.date} ${availableSlot.startTime} - ${availableSlot.endTime}`);

    // Calculate duration
    const startMinutes = parseInt(availableSlot.startTime.split(':')[0]) * 60 + parseInt(availableSlot.startTime.split(':')[1]);
    const endMinutes = parseInt(availableSlot.endTime.split(':')[0]) * 60 + parseInt(availableSlot.endTime.split(':')[1]);
    const duration = endMinutes - startMinutes;

    // Create appointment data (exactly as frontend sends it)
    const appointmentData = {
      patient_id: parseInt(patient.id),
      clinician_id: parseInt(clinician.id),
      centre_id: parseInt(clinician.primaryCentreId),
      appointment_type: 'IN_PERSON',
      scheduled_start_at: new Date(`${availableSlot.date}T${availableSlot.startTime}`).toISOString(),
      duration_minutes: duration,
      notes: 'Test appointment from debug script'
    };

    console.log('\n📝 Creating appointment with data:');
    console.log(JSON.stringify(appointmentData, null, 2));

    console.log('\n🚀 Sending POST request to /api/appointments...');
    const createResponse = await axios.post(`${BASE_URL}/appointments`, appointmentData, { headers });

    console.log('\n✅ Appointment created successfully!');
    console.log(JSON.stringify(createResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('\n🔍 Error details:');
      console.error('  - Status Code:', error.response.status);
      console.error('  - Error Message:', error.response.data.message || error.response.data.error);
      if (error.response.data.details) {
        console.error('  - Details:', error.response.data.details);
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAppointmentCreation();
