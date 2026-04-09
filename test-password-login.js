// Test the new password login endpoint
const axios = require('axios');

async function testPasswordLogin() {
  try {
    console.log('\n🧪 Testing password login endpoint...\n');
    
    const response = await axios.post('http://localhost:5000/api/patient-auth/login-with-password', {
      username: 'testuser123',
      password: 'test@789'
    });
    
    console.log('✅ Login successful!');
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n📋 Access Token (first 50 chars):', response.data.data.accessToken.substring(0, 50) + '...');
    console.log('📋 Refresh Token (first 50 chars):', response.data.data.refreshToken.substring(0, 50) + '...');
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Login failed!');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testPasswordLogin();
