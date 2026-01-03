/**
 * Test Admin Login
 * 
 * This script tests the admin login endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAdminLogin() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('ADMIN LOGIN TEST');
    console.log('='.repeat(60) + '\n');

    // Test 1: Send OTP (with 10-digit phone)
    console.log('=== Test 1: Send OTP (10 digits) ===');
    try {
      const otpResponse = await axios.post(`${BASE_URL}/auth/send-otp`, {
        phone: '9048810697'  // 10 digits without country code
      });
      console.log('✓ OTP Request Response:', otpResponse.data);
      console.log('\n📱 CHECK YOUR WHATSAPP FOR OTP!\n');
    } catch (error) {
      console.log('✗ OTP Request Failed:', error.response?.data || error.message);
    }

    // Test 2: Login with Username + Password
    console.log('\n=== Test 2: Login with Username + Password ===');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login/username-password`, {
        username: 'admin',
        password: 'Admin@123'
      });
      console.log('✓ Login Successful!');
      console.log('✓ User:', loginResponse.data.data.user.name);
      console.log('✓ Role:', loginResponse.data.data.user.role);
      console.log('✓ Access Token:', loginResponse.data.data.accessToken.substring(0, 50) + '...');
    } catch (error) {
      console.log('✗ Login Failed:', error.response?.data || error.message);
    }

    // Test 3: Login with Phone + Password (10 digits)
    console.log('\n=== Test 3: Login with Phone + Password (10 digits) ===');
    try {
      const phoneLoginResponse = await axios.post(`${BASE_URL}/auth/login/phone-password`, {
        phone: '9048810697',  // 10 digits without country code
        password: 'Admin@123'
      });
      console.log('✓ Phone Login Successful!');
      console.log('✓ User:', phoneLoginResponse.data.data.user.name);
    } catch (error) {
      console.log('✗ Phone Login Failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\n💡 Tips:');
    console.log('   - Use 10-digit phone numbers (without country code)');
    console.log('   - Admin phone: 9048810697');
    console.log('   - Admin username: admin');
    console.log('   - Admin password: Admin@123');
    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testAdminLogin();
