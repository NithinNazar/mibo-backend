// Test Gallabox with correct format from support team
const axios = require('axios');

const GALLABOX_API_KEY = '695652f2540814a19bebf8b5';
const GALLABOX_API_SECRET = 'edd9fb89a68548d6a7fb080ea8255b1e';
const GALLABOX_CHANNEL_ID = '693a63bfeba0dac02ac3d624';

// Test phone number (replace with your number)
const TEST_PHONE = '919048810697';
const TEST_OTP = '123456';

async function testGallabox() {
  console.log('🧪 Testing Gallabox with CORRECT format from support team...\n');

  try {
    // Correct format as per Gallabox support
    const payload = {
      channelId: GALLABOX_CHANNEL_ID,
      channelType: 'whatsapp',
      recipient: {
        name: 'Test User',
        phone: TEST_PHONE,
      },
      whatsapp: {
        type: 'template',
        template: {
          templateName: 'otp_verification',
          bodyValues: {
            otp: TEST_OTP, // Named parameter
          },
        },
      },
    };

    console.log('📤 Sending request to Gallabox...');
    console.log('Endpoint: https://server.gallabox.com/devapi/messages/whatsapp');
    console.log('Headers:');
    console.log('  - Content-Type: application/json');
    console.log('  - apiKey:', GALLABOX_API_KEY);
    console.log('  - apiSecret:', GALLABOX_API_SECRET.substring(0, 10) + '...');
    console.log('\nPayload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'https://server.gallabox.com/devapi/messages/whatsapp',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          apiKey: GALLABOX_API_KEY,
          apiSecret: GALLABOX_API_SECRET,
        },
      }
    );

    console.log('\n✅ SUCCESS! WhatsApp message sent!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n📱 Check WhatsApp on', TEST_PHONE, 'for the OTP message!');
  } catch (error) {
    console.error('\n❌ FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testGallabox();
