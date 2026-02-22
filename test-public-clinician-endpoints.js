const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPublicClinicianEndpoints() {
  console.log('🧪 Testing Public Clinician Endpoints\n');
  console.log('=' .repeat(60));

  // Test 1: GET /api/clinicians (old endpoint)
  console.log('\n📍 Test 1: GET /api/clinicians');
  try {
    const response = await axios.get(`${BASE_URL}/clinicians`);
    console.log('✅ Status:', response.status);
    console.log('✅ Found', response.data.length || response.data.data?.length || 0, 'clinicians');
    if (response.data.length > 0 || response.data.data?.length > 0) {
      const clinicians = response.data.data || response.data;
      console.log('✅ First clinician:', clinicians[0].name || clinicians[0].fullName || clinicians[0].full_name);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 2: GET /api/users/clinicians (new endpoint)
  console.log('\n📍 Test 2: GET /api/users/clinicians');
  try {
    const response = await axios.get(`${BASE_URL}/users/clinicians`);
    console.log('✅ Status:', response.status);
    console.log('✅ Found', response.data.length || response.data.data?.length || 0, 'clinicians');
    if (response.data.length > 0 || response.data.data?.length > 0) {
      const clinicians = response.data.data || response.data;
      console.log('✅ First clinician:', clinicians[0].name || clinicians[0].fullName || clinicians[0].full_name);
      console.log('✅ Sample data structure:');
      console.log(JSON.stringify(clinicians[0], null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 3: GET /api/clinicians/:id (old endpoint)
  console.log('\n📍 Test 3: GET /api/clinicians/1');
  try {
    const response = await axios.get(`${BASE_URL}/clinicians/1`);
    console.log('✅ Status:', response.status);
    console.log('✅ Clinician:', response.data.name || response.data.data?.name || response.data.data?.fullName);
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 4: GET /api/users/clinicians/:id (new endpoint)
  console.log('\n📍 Test 4: GET /api/users/clinicians/1');
  try {
    const response = await axios.get(`${BASE_URL}/users/clinicians/1`);
    console.log('✅ Status:', response.status);
    console.log('✅ Clinician:', response.data.name || response.data.data?.name || response.data.data?.fullName);
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 5: GET /api/clinicians/:id/slots (old endpoint)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  console.log(`\n📍 Test 5: GET /api/clinicians/1/slots?date=${dateStr}&centreId=1`);
  try {
    const response = await axios.get(`${BASE_URL}/clinicians/1/slots`, {
      params: { date: dateStr, centreId: 1 }
    });
    console.log('✅ Status:', response.status);
    console.log('✅ Found', response.data.length || response.data.data?.length || 0, 'slots');
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Test 6: GET /api/users/clinicians/:id/slots (new endpoint)
  console.log(`\n📍 Test 6: GET /api/users/clinicians/1/slots?date=${dateStr}&centreId=1`);
  try {
    const response = await axios.get(`${BASE_URL}/users/clinicians/1/slots`, {
      params: { date: dateStr, centreId: 1 }
    });
    console.log('✅ Status:', response.status);
    console.log('✅ Found', response.data.length || response.data.data?.length || 0, 'slots');
    if (response.data.length > 0 || response.data.data?.length > 0) {
      const slots = response.data.data || response.data;
      console.log('✅ Sample slot:', slots[0]);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log('   - Check which endpoints are working');
  console.log('   - Frontend should use the working endpoints');
  console.log('   - Both /api/clinicians and /api/users/clinicians might be mounted');
}

testPublicClinicianEndpoints();
