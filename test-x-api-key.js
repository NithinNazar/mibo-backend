// Test with x-api-key header
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GALLABOX_API_KEY;
const CHANNEL_ID = process.env.GALLABOX_CHANNEL_ID;

console.log('\n🔍 Testing x-api-key header\n');
console.log('API Key:', API_KEY);
console.log('Channel ID:', CHANNEL_ID);
console.log('\n');

async function test() {
  const payload = {
    channelId: CHANNEL_ID,
    to: '919048810697',
    type: 'template',
    template: {
      name: 'otp_verification',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: '123456' }],
        },
      ],
    },
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('\n');

  try {
    const response = await axios.post(
      'https://server.gallabox.com/api/v1/messages/whatsapp',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        timeout: 10000,
      }
    );

    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
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

test().catch(console.error);
