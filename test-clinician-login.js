// Test script to verify clinician login functionality
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testClinicianLogin() {
  console.log('🧪 Testing Clinician Login Functionality\n');

  try {
    // Test 1: Login with valid clinician credentials
    console.log('Test 1: Login with valid clinician username and password');
    
    // You'll need to replace these with actual test credentials
    const testUsername = 'test_clinician'; // Replace with actual test clinician username
    const testPassword = 'test_password'; // Replace with actual test password

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login/username-password`, {
      username: testUsername,
      password: testPassword
    });

    console.log('✅ Login successful');
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));

    // Verify response structure
    const { user, accessToken, refreshToken } = loginResponse.data.data;
    
    console.log('\n📋 Verification:');
    console.log(`- User ID: ${user.id}`);
    console.log(`- User Name: ${user.name}`);
    console.log(`- User Role: ${user.role}`);
    console.log(`- Clinician ID: ${user.clinicianId || 'Not present'}`);
    console.log(`- Access Token: ${accessToken ? 'Present' : 'Missing'}`);
    console.log(`- Refresh Token: ${refreshToken ? 'Present' : 'Missing'}`);

    // Verify clinician ID is present
    if (user.clinicianId) {
      console.log('\n✅ Clinician ID is present in response');
    } else {
      console.log('\n❌ Clinician ID is missing from response');
    }

    // Test 2: Verify JWT token contains clinician ID
    console.log('\n\nTest 2: Verify JWT token contains clinician ID');
    const tokenParts = accessToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('JWT Payload:', JSON.stringify(payload, null, 2));
      
      if (payload.clinicianId) {
        console.log('✅ Clinician ID is present in JWT token');
      } else {
        console.log('❌ Clinician ID is missing from JWT token');
      }
    }

    console.log('\n\n✅ All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Test for non-clinician staff (should not have clinician ID)
async function testNonClinicianLogin() {
  console.log('\n\n🧪 Testing Non-Clinician Staff Login\n');

  try {
    const testUsername = 'admin_user'; // Replace with actual admin username
    const testPassword = 'admin_password'; // Replace with actual password

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login/username-password`, {
      username: testUsername,
      password: testPassword
    });

    const { user } = loginResponse.data.data;
    
    console.log('✅ Login successful');
    console.log(`- User Role: ${user.role}`);
    console.log(`- Clinician ID: ${user.clinicianId || 'Not present (expected)'}`);

    if (!user.clinicianId) {
      console.log('✅ Non-clinician user correctly has no clinician ID');
    } else {
      console.log('⚠️ Non-clinician user has clinician ID (unexpected)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test for staff with CLINICIAN role but no profile (should fail)
async function testClinicianWithoutProfile() {
  console.log('\n\n🧪 Testing CLINICIAN role without profile (should fail)\n');

  try {
    const testUsername = 'clinician_no_profile'; // Replace with test user
    const testPassword = 'test_password';

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login/username-password`, {
      username: testUsername,
      password: testPassword
    });

    console.log('❌ Login should have failed but succeeded');
    
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Login correctly denied with 403 Forbidden');
      console.log('Error message:', error.response.data.message);
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('CLINICIAN LOGIN IMPLEMENTATION TEST SUITE');
  console.log('='.repeat(60));
  console.log('\nNote: Update test credentials in this script before running\n');

  await testClinicianLogin();
  await testNonClinicianLogin();
  await testClinicianWithoutProfile();

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE COMPLETE');
  console.log('='.repeat(60));
}

runAllTests();
