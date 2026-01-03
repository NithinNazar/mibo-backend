// Test Google Meet Integration
// This script tests the Google Meet link creation functionality

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_PHONE = '9048810697';

// Test credentials
const TEST_USER = {
  phone: TEST_PHONE,
  name: 'Test Patient'
};

async function testGoogleMeetIntegration() {
  console.log('🧪 Testing Google Meet Integration\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login/Register
    console.log('\n📱 Step 1: Patient Authentication');
    console.log('-'.repeat(60));
    
    const authResponse = await axios.post(`${BASE_URL}/patient-auth/send-otp`, {
      phone: TEST_PHONE
    });
    
    console.log('✅ OTP sent to:', TEST_PHONE);
    console.log('Response:', authResponse.data);
    
    // Get OTP from user
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const otp = await new Promise(resolve => {
      readline.question('\nEnter OTP received on WhatsApp: ', resolve);
    });
    readline.close();
    
    const verifyResponse = await axios.post(`${BASE_URL}/patient-auth/verify-otp`, {
      phone: TEST_PHONE,
      otp: otp
    });
    
    const token = verifyResponse.data.data.token;
    console.log('✅ OTP verified, token received');
    
    // Step 2: Book ONLINE appointment
    console.log('\n📅 Step 2: Booking ONLINE Appointment');
    console.log('-'.repeat(60));
    
    // Get future date (tomorrow at 10 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const bookingResponse = await axios.post(
      `${BASE_URL}/booking/book`,
      {
        clinicianId: 1,
        centreId: 1,
        appointmentType: 'ONLINE', // Important: ONLINE type
        scheduledStartAt: tomorrow.toISOString(),
        durationMinutes: 50,
        notes: 'Test online consultation with Google Meet'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const appointmentId = bookingResponse.data.data.appointment.id;
    console.log('✅ Online appointment booked');
    console.log('Appointment ID:', appointmentId);
    console.log('Type:', bookingResponse.data.data.appointment.appointmentType);
    console.log('Scheduled:', bookingResponse.data.data.appointment.scheduledStartAt);
    
    // Step 3: Create payment order
    console.log('\n💳 Step 3: Creating Payment Order');
    console.log('-'.repeat(60));
    
    const paymentOrderResponse = await axios.post(
      `${BASE_URL}/payment/create-order`,
      {
        appointmentId: appointmentId
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Payment order created');
    console.log('Order ID:', paymentOrderResponse.data.data.orderId);
    console.log('Amount:', paymentOrderResponse.data.data.amount / 100, 'INR');
    
    console.log('\n⚠️  MANUAL STEP REQUIRED:');
    console.log('1. Complete the payment using Razorpay test mode');
    console.log('2. Get the payment ID and signature');
    console.log('3. Call the verify payment endpoint');
    console.log('\nPayment verification will trigger:');
    console.log('  → Google Meet link creation');
    console.log('  → WhatsApp notification with Meet link');
    console.log('  → Database update with Meet link and event ID');
    
    console.log('\n📋 Verify Payment Endpoint:');
    console.log(`POST ${BASE_URL}/payment/verify`);
    console.log('Body:');
    console.log(JSON.stringify({
      appointmentId: appointmentId,
      razorpayOrderId: paymentOrderResponse.data.data.orderId,
      razorpayPaymentId: '<payment_id_from_razorpay>',
      razorpaySignature: '<signature_from_razorpay>'
    }, null, 2));
    
    console.log('\n📊 Check Database After Payment:');
    console.log(`SELECT id, appointment_type, google_meet_link, google_meet_event_id, status`);
    console.log(`FROM appointments WHERE id = ${appointmentId};`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test setup complete!');
    console.log('Complete the payment to test Google Meet integration');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run test
testGoogleMeetIntegration();
