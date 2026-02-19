require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCorrectEndpoints() {
  console.log('=== TESTING CORRECT CLINICIAN ENDPOINTS ===\n');

  try {
    // Test 1: GET /api/users/clinicians (the actual working endpoint)
    console.log('1. Testing GET /api/users/clinicians (correct endpoint)...');
    try {
      const response = await axios.get(`${API_BASE}/users/clinicians`);
      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Success: ${response.data.success}`);
      console.log(`✓ Found ${response.data.data?.length || 0} clinicians`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n✓ Clinicians found:');
        response.data.data.forEach((c, i) => {
          console.log(`  ${i + 1}. ${c.fullName || c.name} (ID: ${c.id})`);
          console.log(`     - Specialization: ${JSON.stringify(c.specialization)}`);
          console.log(`     - Fee: ₹${c.consultationFee}`);
        });
      }
    } catch (error) {
      console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test 2: GET /api/users/clinicians/:id
    console.log('\n2. Testing GET /api/users/clinicians/49 (correct endpoint)...');
    try {
      const response = await axios.get(`${API_BASE}/users/clinicians/49`);
      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Clinician: ${response.data.data.fullName || response.data.data.name}`);
      console.log(`✓ Has bio: ${response.data.data.bio ? 'Yes' : 'No'}`);
      console.log(`✓ Has availability rules: ${response.data.data.availabilityRules ? response.data.data.availabilityRules.length + ' rules' : 'No'}`);
    } catch (error) {
      console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test 3: GET /api/users/clinicians/:id/availability
    console.log('\n3. Testing GET /api/users/clinicians/48/availability (correct endpoint)...');
    try {
      const response = await axios.get(`${API_BASE}/users/clinicians/48/availability`);
      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Found ${response.data.data?.length || 0} availability rules`);
    } catch (error) {
      console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testCorrectEndpoints();
