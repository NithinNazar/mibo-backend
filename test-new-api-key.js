// Test new Gallabox API credentials
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GALLABOX_API_KEY;
const API_SECRET = process.env.GALLABOX_API_SECRET;
const CHANNEL_ID = process.env.GALLABOX_CHANNEL_ID;
const BASE_URL = process.env.GALLABOX_BASE_URL;

console.log('\n🔍 Testing NEW Gallabox API Credentials\n');
console.log('API Key:', API_KEY);
console.log('API Secret:', API_SECRET);
console.log('Channel ID:', CHANNEL_ID);
console.log('Base URL:', BASE_URL);
console.log('\n');

async function test() {
  const phone = '919048810697';
  const otp = '123456';

  // Try different payload formats for authentication template
  const payloads = [
    {
      name: 'Format 1: type=template',
      data: {
        channelId: CHANNEL_ID,
        channelType: 'whatsapp',
        recipient: {
          name: 'Test',
          phone: phone,
        },
        whatsapp: {
          type: 'template',
          template: {
            name: 'otp_verification',
            languageCode: 'en',
            bodyValues: [otp],
          },
        },
      },
    },
    {
      name: 'Format 2: type=authentication',
      data: {
        channelId: CHANNEL_ID,
        channelType: 'whatsapp',
        recipient: {
          name: 'Test',
          phone: phone,
        },
        whatsapp: {
          type: 'authentication',
          template: {
            name: 'otp_verification',
            languageCode: 'en',
            bodyValues: [otp],
          },
        },
      },
    },
    {
      name: 'Format 3: authentication with components',
      data: {
        channelId: CHANNEL_ID,
        channelType: 'whatsapp',
        recipient: {
          name: 'Test',
          phone: phone,
        },
        whatsapp: {
          type: 'authentication',
          authentication: {
            name: 'otp_verification',
            language: {
              code: 'en',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: otp,
                  },
                ],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: 0,
                parameters: [
                  {
                    type: 'text',
                    text: otp,
                  },
                ],
              },
            ],
          },
        },
      },
    },
  ];

  const authMethod = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };

  for (const payload of payloads) {
    console.log(`\n🧪 Testing: ${payload.name}`);
    console.log('Payload:', JSON.stringify(payload.data, null, 2));
    
    try {
      const response = await axios.post(
        `${BASE_URL}/devapi/messages/whatsapp`,
        payload.data,
        { headers: authMethod, timeout: 10000 }
      );

      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('\n🎉 This format works! Update the code to use this.');
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

  console.log('\n❌ All formats failed!');
  console.log('\n💡 Next steps:');
  console.log('1. Verify Channel ID in Gallabox dashboard');
  console.log('2. Check if API access is enabled for this channel');
  console.log('3. Contact Gallabox support with these error details');
}

test().catch(console.error);
