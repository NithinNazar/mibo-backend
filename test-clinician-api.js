require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testClinicianAPI() {
  console.log('=== TESTING CLINICIAN API ===\n');

  try {
    // Test 1: Get existing clinicians
    console.log('1. Testing GET /api/clinicians...');
    try {
      const response = await axios.get(`${API_BASE}/clinicians`);
      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Found ${response.data.data?.length || 0} clinicians`);
      if (response.data.data && response.data.data.length > 0) {
        console.log('Sample clinician:', JSON.stringify(response.data.data[0], null, 2));
      }
    } catch (error) {
      console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      if (error.response?.data) {
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Test 2: Create a new clinician
    console.log('\n2. Testing POST /api/clinicians...');
    const newClinician = {
      full_name: "Test Clinician API",
      phone: "9876543299",
      email: "test.api@example.com",
      username: "test_api_clinician",
      password: "TestPassword123",
      role_ids: [4],
      centre_ids: [1],
      designation: "Clinical Psychologist",
      primary_centre_id: 1,
      specialization: ["Clinical Psychologist"],
      years_of_experience: 5,
      consultation_fee: 1200,
      bio: "Test clinician for API testing",
      consultation_modes: ["IN_PERSON", "ONLINE"],
      default_consultation_duration_minutes: 30,
      qualification: ["M.Phil", "Ph.D."],
      expertise: ["Anxiety Disorders", "Depression"],
      languages: ["English", "Hindi"],
      availability_slots: [
        {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          consultationMode: "IN_PERSON"
        },
        {
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "11:00",
          consultationMode: "IN_PERSON"
        }
      ]
    };

    try {
      const response = await axios.post(`${API_BASE}/clinicians`, newClinician);
      console.log(`✓ Status: ${response.status}`);
      console.log('✓ Clinician created successfully');
      console.log('Created clinician:', JSON.stringify(response.data.data, null, 2));
      
      const clinicianId = response.data.data.id;
      
      // Test 3: Get the created clinician by ID
      console.log(`\n3. Testing GET /api/clinicians/${clinicianId}...`);
      try {
        const getResponse = await axios.get(`${API_BASE}/clinicians/${clinicianId}`);
        console.log(`✓ Status: ${getResponse.status}`);
        console.log('Retrieved clinician:', JSON.stringify(getResponse.data.data, null, 2));
      } catch (error) {
        console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }

      // Test 4: Check availability rules
      console.log(`\n4. Testing GET /api/clinicians/${clinicianId}/availability...`);
      try {
        const availResponse = await axios.get(`${API_BASE}/clinicians/${clinicianId}/availability`);
        console.log(`✓ Status: ${availResponse.status}`);
        console.log(`✓ Found ${availResponse.data.data?.length || 0} availability rules`);
        if (availResponse.data.data && availResponse.data.data.length > 0) {
          console.log('Availability rules:', JSON.stringify(availResponse.data.data, null, 2));
        }
      } catch (error) {
        console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }

    } catch (error) {
      console.log(`✗ Error creating clinician: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      if (error.response?.data) {
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testClinicianAPI();
