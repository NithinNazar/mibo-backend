require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testPublicEndpoints() {
  console.log('=== TESTING PUBLIC CLINICIAN ENDPOINTS (NO AUTH) ===\n');

  try {
    // Test 1: GET /api/clinicians (PUBLIC - no auth required)
    console.log('1. Testing GET /api/clinicians (PUBLIC endpoint)...');
    try {
      const response = await axios.get(`${API_BASE}/clinicians`);
      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Success: ${response.data.success}`);
      console.log(`✓ Found ${response.data.data?.length || 0} clinicians`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n✓ Sample clinician data:');
        const sample = response.data.data[0];
        console.log(`  - ID: ${sample.id}`);
        console.log(`  - Name: ${sample.fullName || sample.name}`);
        console.log(`  - Specialization: ${JSON.stringify(sample.specialization)}`);
        console.log(`  - Consultation Fee: ${sample.consultationFee}`);
        console.log(`  - Years of Experience: ${sample.yearsOfExperience}`);
        console.log(`  - Primary Centre: ${sample.primaryCentreName}`);
        console.log(`  - Has bio: ${sample.bio ? 'Yes' : 'No'}`);
        console.log(`  - Qualification: ${JSON.stringify(sample.qualification)}`);
        console.log(`  - Languages: ${JSON.stringify(sample.languages)}`);
      } else {
        console.log('⚠ No clinicians found in response');
      }
    } catch (error) {
      console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      if (error.response?.data) {
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Test 2: GET /api/clinicians/:id (PUBLIC - no auth required)
    console.log('\n2. Testing GET /api/clinicians/49 (PUBLIC endpoint)...');
    try {
      const response = await axios.get(`${API_BASE}/clinicians/49`);
      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Success: ${response.data.success}`);
      
      const clinician = response.data.data;
      console.log('\n✓ Clinician details:');
      console.log(`  - ID: ${clinician.id}`);
      console.log(`  - Name: ${clinician.fullName || clinician.name}`);
      console.log(`  - Bio: ${clinician.bio ? clinician.bio.substring(0, 100) + '...' : 'No bio'}`);
      console.log(`  - Specialization: ${JSON.stringify(clinician.specialization)}`);
      console.log(`  - Qualification: ${JSON.stringify(clinician.qualification)}`);
      console.log(`  - Languages: ${JSON.stringify(clinician.languages)}`);
      console.log(`  - Expertise: ${JSON.stringify(clinician.expertise)}`);
      console.log(`  - Consultation Modes: ${JSON.stringify(clinician.consultationModes)}`);
      console.log(`  - Has availability rules: ${clinician.availabilityRules ? 'Yes (' + clinician.availabilityRules.length + ' rules)' : 'No'}`);
    } catch (error) {
      console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      if (error.response?.data) {
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Test 3: GET /api/clinicians/:id/availability (PUBLIC - no auth required)
    console.log('\n3. Testing GET /api/clinicians/48/availability (PUBLIC endpoint)...');
    try {
      const response = await axios.get(`${API_BASE}/clinicians/48/availability`);
      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Success: ${response.data.success}`);
      console.log(`✓ Found ${response.data.data?.length || 0} availability rules`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n✓ Sample availability rules:');
        response.data.data.slice(0, 3).forEach((rule, index) => {
          console.log(`  Rule ${index + 1}:`);
          console.log(`    - Day: ${rule.dayOfWeek || rule.day_of_week}`);
          console.log(`    - Time: ${rule.startTime || rule.start_time} - ${rule.endTime || rule.end_time}`);
          console.log(`    - Mode: ${rule.mode || rule.consultationMode}`);
        });
      }
    } catch (error) {
      console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    console.log('\n=== ALL PUBLIC ENDPOINTS TESTED ===');

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testPublicEndpoints();
