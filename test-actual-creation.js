const axios = require('axios');
require('dotenv').config();

async function testActualCreation() {
  try {
    console.log('\n=== TESTING ACTUAL API CALL ===\n');
    
    // Login first to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('https://api.mibo.care/api/auth/login', {
      phone: '9048810697',
      password: 'Mibo@2024'
    });
    
    const token = loginResponse.data.data.token;
    console.log('   ✓ Logged in successfully');
    
    // Try to create a clinician
    console.log('\n2. Creating clinician...');
    const clinicianData = {
      full_name: "Test Clinician API",
      phone: "8888888888", // Different phone
      password: "Test@12345",
      role_ids: [4],
      centre_ids: [1],
      primary_centre_id: 1,
      specialization: ["Clinical Psychologist"],
      years_of_experience: 5,
      consultation_fee: 1500,
      consultation_modes: ["IN_PERSON"],
      default_consultation_duration_minutes: 45,
      qualification: ["M.Phil"],
      languages: ["English"]
    };
    
    console.log('   Sending data:', JSON.stringify(clinicianData, null, 2));
    
    const response = await axios.post(
      'https://api.mibo.care/api/clinicians',
      clinicianData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✓ SUCCESS! Clinician created:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERROR:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
      console.log('\nFull Response Headers:', error.response.headers);
    } else {
      console.log(error.message);
    }
  }
}

testActualCreation();
