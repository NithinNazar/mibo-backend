// Test script to verify clinician API returns defaultDurationMinutes field
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function testClinicianAPI() {
  try {
    console.log('🔍 Testing Clinician API for duration field...\n');

    // Get all clinicians
    const response = await axios.get(`${API_BASE_URL}/users/clinicians`, {
      params: { isActive: true }
    });

    const clinicians = response.data.data;
    
    if (!clinicians || clinicians.length === 0) {
      console.log('❌ No clinicians found in database');
      return;
    }

    console.log(`✅ Found ${clinicians.length} active clinician(s)\n`);

    // Check each clinician
    clinicians.forEach((clinician, index) => {
      console.log(`\n--- Clinician ${index + 1}: ${clinician.fullName} ---`);
      console.log(`ID: ${clinician.id}`);
      console.log(`User ID: ${clinician.userId}`);
      console.log(`Consultation Fee: ₹${clinician.consultationFee || 'NOT SET'}`);
      console.log(`Default Duration (minutes): ${clinician.defaultDurationMinutes || 'NOT SET'}`);
      
      // Check if field exists
      if (clinician.defaultDurationMinutes !== undefined) {
        console.log(`✅ defaultDurationMinutes field EXISTS in API response`);
      } else {
        console.log(`❌ defaultDurationMinutes field MISSING in API response`);
      }

      // Show all fields for debugging
      console.log('\nAll fields returned by API:');
      console.log(Object.keys(clinician).join(', '));
    });

    // Test individual clinician endpoint
    if (clinicians.length > 0) {
      const firstClinicianId = clinicians[0].id;
      console.log(`\n\n🔍 Testing individual clinician endpoint: /users/clinicians/${firstClinicianId}`);
      
      const singleResponse = await axios.get(`${API_BASE_URL}/users/clinicians/${firstClinicianId}`);
      const singleClinician = singleResponse.data.data;
      
      console.log(`\nClinician: ${singleClinician.fullName}`);
      console.log(`Default Duration: ${singleClinician.defaultDurationMinutes || 'NOT SET'}`);
      
      if (singleClinician.defaultDurationMinutes !== undefined) {
        console.log(`✅ defaultDurationMinutes field EXISTS in single clinician API response`);
      } else {
        console.log(`❌ defaultDurationMinutes field MISSING in single clinician API response`);
      }

      console.log('\nAll fields:');
      console.log(Object.keys(singleClinician).join(', '));
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testClinicianAPI();
