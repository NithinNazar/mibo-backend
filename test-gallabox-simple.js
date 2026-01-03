// Simple Gallabox API test
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GALLABOX_API_KEY;
const API_SECRET = process.env.GALLABOX_API_SECRET;
const CHANNEL_ID = process.env.GALLABOX_CHANNEL_ID;
const BASE_URL = process.env.GALLABOX_BASE_URL || 'https://server.gallabox.com/api/v1';

console.log('\n🔍 Testing Gallabox API\n');
console.log('Base URL:', BASE_URL);
console.log('API Key:', API_KEY);
console.log('API Secret:', API_SECRET);
console.log('Channel ID:', CHANNEL_ID);
console.log('\n');

async function test() {
  const phone = '919048810697';
  const message = 'Test from Mibo';

  // Test different auth methods
  const authMethods = [
    {
      name: 'Bearer with API Key',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    },
    {
      name: 'Bearer with API Secret',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_SECRET}`,
      },
    },
    {
      name: 'apiKey and apiSecret headers',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': API_KEY,
        'apiSecret': API_SECRET,
      },
    },
    {
      name: 'x-api-key header',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    },
  ];

  const payload = {
    channelId: CHANNEL_ID,
    channelType: 'whatsapp',
    recipient: {
      name: 'Test',
      phone: phone,
    },
    whatsapp: {
      type: 'text',
      text: {
        body: message,
      },
    },
  };

  for (const auth of authMethods) {
    console.log(`\n🧪 Testing: ${auth.name}`);
    console.log('Headers:', JSON.stringify(auth.headers, null, 2));

    try {
      const response = await axios.post(
        `${BASE_URL}/devapi/messages/whatsapp`,
        payload,
        { headers: auth.headers, timeout: 10000 }
      );

      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('\n🎉 This auth method works!');
      return;
    } catch (error) {
      console.log('❌ FAILED');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }
  }

  console.log('\n❌ All auth methods failed!');
  console.log('\n💡 Suggestions:');
  console.log('1. Verify API credentials in Gallabox dashboard');
  console.log('2. Check if WhatsApp number is connected');
  console.log('3. Ensure account is active and has credits');
  console.log('4. Contact Gallabox support for correct API format');
}

test().catch(console.error);
