/**
 * Test with OTP - Manual OTP Entry
 * 
 * Usage: node test-with-otp.js YOUR_OTP_HERE
 * Example: node test-with-otp.js 123456
 */

const BASE_URL = 'http://localhost:5000/api';
const TEST_PHONE = '919048810697';
const TEST_NAME = 'Test User';
const TEST_EMAIL = 'test@example.com';

// Get OTP from command line argument
const OTP = process.argv[2];

if (!OTP) {
  console.log('\n❌ Please provide OTP as argument');
  console.log('Usage: node test-with-otp.js YOUR_OTP');
  console.log('Example: node test-with-otp.js 123456\n');
  process.exit(1);
}

console.log(`\n🧪 Testing with OTP: ${OTP}\n`);

let accessToken = '';
let appointmentId = 0;

async function testVerifyOTP() {
  console.log('📝 Step 1: Verifying OTP...');
  
  try {
    const response = await fetch(`${BASE_URL}/patient-auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: TEST_PHONE,
        otp: OTP,
        full_name: TEST_NAME,
        email: TEST_EMAIL,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ OTP verification failed:', data.message);
      return false;
    }
    
    accessToken = data.data.accessToken;
    console.log('✅ OTP verified successfully!');
    console.log(`   User: ${data.data.user.full_name}`);
    console.log(`   Token: ${accessToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testCreateAppointment() {
  console.log('\n📝 Step 2: Creating appointment...');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDate = tomorrow.toISOString().split('T')[0];
    
    const response = await fetch(`${BASE_URL}/booking/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        clinicianId: 1,
        centreId: 1,
        appointmentDate: appointmentDate,
        appointmentTime: '10:00',
        appointmentType: 'ONLINE',
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Appointment creation failed:', data.message);
      return false;
    }
    
    appointmentId = data.data.appointment.id;
    console.log('✅ Appointment created successfully!');
    console.log(`   Appointment ID: ${appointmentId}`);
    console.log(`   Status: ${data.data.appointment.status}`);
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testCreatePaymentOrder() {
  console.log('\n📝 Step 3: Creating payment order...');
  
  try {
    const response = await fetch(`${BASE_URL}/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        appointmentId: appointmentId,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Payment order creation failed:', data.message);
      return false;
    }
    
    console.log('✅ Payment order created successfully!');
    console.log(`   Order ID: ${data.data.orderId}`);
    console.log(`   Amount: ₹${data.data.amount / 100}`);
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testDashboard() {
  console.log('\n📝 Step 4: Getting dashboard...');
  
  try {
    const response = await fetch(`${BASE_URL}/patient/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Dashboard failed:', data.message);
      return false;
    }
    
    console.log('✅ Dashboard retrieved successfully!');
    console.log(`   Total Appointments: ${data.data.statistics.totalAppointments}`);
    console.log(`   Upcoming: ${data.data.statistics.upcomingAppointments}`);
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  if (await testVerifyOTP()) {
    passed++;
    
    if (await testCreateAppointment()) {
      passed++;
      
      if (await testCreatePaymentOrder()) {
        passed++;
      } else {
        failed++;
      }
      
      if (await testDashboard()) {
        passed++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
  } else {
    failed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }
  console.log('='.repeat(60) + '\n');
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Backend is working perfectly!\n');
  }
}

runTests().catch(error => {
  console.log(`\n❌ Fatal error: ${error.message}\n`);
  process.exit(1);
});
