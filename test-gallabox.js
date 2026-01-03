// Quick test script to verify Gallabox API credentials
const axios = require('axios');
require('dotenv').config();

const GALLABOX_BASE_URL = process.env.GALLABOX_BASE_URL || 'https://api.gallabox.com/wa/api/v1';
const GALLABOX_API_KEY = process.env.GALLABOX_API_KEY;
const GALLABOX_API_SECRET = process.env.GALLABOX_API_SECRET;
const GALLABOX_CHANNEL_ID = process.env.GALLABOX_CHANNEL_ID;

console.log('\n🔍 Testing Gallabox API Credentials\n');
console.log('Base URL:', GALLABOX_BASE_URL);
console.log('API Key:', GALLABOX_API_KEY ? `${GALLABOX_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('API Secret:', GALLABOX_API_SECRET ? `${GALLABOX_API_SECRET.substring(0, 10)}...` : 'NOT SET');
console.log('Channel ID:', GALLABOX_CHANNEL_ID || 'NOT SET');
console.log('\n');

if (!GALLABOX_API_KEY || !GALLABOX_API_SECRET) {
  console.error('❌ Gallabox credentials not configured in .env file');
  process.exit(1);
}

const client = axios.create({
  baseURL: GALLABOX_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apiKey': GALLABOX_API_KEY,
    'apiSecret': GALLABOX_API_SECRET,
  },
  timeout: 10000,
});

async function testGallabox() {
  const testPhone = '919048810697'; // Your phone number
  const testMessage = 'Test message from Mibo backend - please ignore';

  console.log(`📱 Sending test message to ${testPhone}...\n`);

  // Try different payload formats
  const formats = [
    {
      name: 'Format 1: Standard with channelId',
      payload: {
        channelId: GALLABOX_CHANNEL_ID,
        channelType: 'whatsapp',
        recipient: {
          name: 'Test User',
          phone: testPhone,
        },
        whatsapp: {
          type: 'text',
          text: {
            body: testMessage,
          },
        },
      },
    },
    {
      name: 'Format 2: Simplified',
      payload: {
        channelId: GALLABOX_CHANNEL_ID,
        recipient: testPhone,
        message: {
          type: 'text',
          text: testMessage,
        },
      },
    },
    {
      name: 'Format 3: Direct',
      payload: {
        to: testPhone,
        type: 'text',
        message: testMessage,
      },
    },
    {
      name: 'Format 4: With phone in recipient',
      payload: {
        recipient: {
          phone: testPhone,
        },
        message: {
          type: 'text',
          body: testMessage,
        },
      },
    },
  ];

  for (const format of formats) {
    console.log(`\n🧪 Testing ${format.name}...`);
    console.log('Payload:', JSON.stringify(format.payload, null, 2));

    try {
      const response = await client.post('/messages/whatsapp', format.payload);
      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('\n🎉 This format works! Update the code to use this format.');
      return;
    } catch (error) {
      console.log('❌ FAILED');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }
  }

  console.log('\n❌ All formats failed. Possible issues:');
  console.log('1. Invalid API credentials');
  console.log('2. WhatsApp number not connected in Gallabox');
  console.log('3. Incorrect API endpoint');
  console.log('4. Account suspended or insufficient balance');
  console.log('\n💡 Next steps:');
  console.log('- Log in to Gallabox dashboard: https://app.gallabox.com/');
  console.log('- Verify API credentials in Settings → API');
  console.log('- Check WhatsApp connection status');
  console.log('- Check account balance/credits');
}

testGallabox().catch(console.error);
