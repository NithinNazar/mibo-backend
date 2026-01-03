/**
 * Complete Production Flow Test
 * 
 * Tests the entire flow:
 * 1. Send OTP
 * 2. Verify OTP (create user)
 * 3. Create appointment
 * 4. Create payment order
 * 5. Get dashboard
 * 6. Get appointments
 * 7. Get payments
 * 8. Get profile
 * 
 * Run: node test-production-flow.js
 */

const BASE_URL = 'http://localhost:5000/api';

// Test phone number (replace with your actual number)
const TEST_PHONE = '919048810697';
const TEST_NAME = 'Test User';
const TEST_EMAIL = 'test@example.com';

// Store tokens and IDs
let accessToken = '';
let appointmentId = 0;
let orderId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`STEP ${step}: ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function makeRequest(endpoint, method = 'GET', body = null, useAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (useAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  logInfo(`${method} ${url}`);
  if (body) {
    logInfo(`Body: ${JSON.stringify(body, null, 2)}`);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  
  return data;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test1_SendOTP() {
  logStep(1, 'Send OTP via WhatsApp');
  
  try {
    const response = await makeRequest('/patient-auth/send-otp', 'POST', {
      phone: TEST_PHONE,
    });
    
    logSuccess('OTP sent successfully!');
    log(JSON.stringify(response, null, 2), 'yellow');
    logInfo('Check your WhatsApp for the OTP');
    
    return true;
  } catch (error) {
    logError(`Failed to send OTP: ${error.message}`);
    return false;
  }
}

async function test2_VerifyOTP(otp) {
  logStep(2, 'Verify OTP and Create/Login User');
  
  try {
    const response = await makeRequest('/patient-auth/verify-otp', 'POST', {
      phone: TEST_PHONE,
      otp: otp,
      full_name: TEST_NAME,
      email: TEST_EMAIL,
    });
    
    // Store access token
    accessToken = response.data.accessToken;
    
    logSuccess('OTP verified successfully!');
    logSuccess(`User: ${response.data.user.full_name}`);
    logSuccess(`Access Token: ${accessToken.substring(0, 20)}...`);
    log(JSON.stringify(response, null, 2), 'yellow');
    
    return true;
  } catch (error) {
    logError(`Failed to verify OTP: ${error.message}`);
    return false;
  }
}

async function test3_CreateAppointment() {
  logStep(3, 'Create Appointment');
  
  try {
    // Calculate appointment date (tomorrow at 10:00 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDate = tomorrow.toISOString().split('T')[0];
    
    const response = await makeRequest('/booking/create', 'POST', {
      clinicianId: 1,
      centreId: 1,
      appointmentDate: appointmentDate,
      appointmentTime: '10:00',
      appointmentType: 'ONLINE',
    }, true);
    
    // Store appointment ID
    appointmentId = response.data.appointment.id;
    
    logSuccess('Appointment created successfully!');
    logSuccess(`Appointment ID: ${appointmentId}`);
    logSuccess(`Status: ${response.data.appointment.status}`);
    log(JSON.stringify(response, null, 2), 'yellow');
    
    return true;
  } catch (error) {
    logError(`Failed to create appointment: ${error.message}`);
    return false;
  }
}

async function test4_CreatePaymentOrder() {
  logStep(4, 'Create Payment Order');
  
  try {
    const response = await makeRequest('/payment/create-order', 'POST', {
      appointmentId: appointmentId,
    }, true);
    
    // Store order ID
    orderId = response.data.orderId;
    
    logSuccess('Payment order created successfully!');
    logSuccess(`Order ID: ${orderId}`);
    logSuccess(`Amount: ₹${response.data.amount / 100}`);
    logSuccess(`Razorpay Key: ${response.data.razorpayKeyId}`);
    log(JSON.stringify(response, null, 2), 'yellow');
    
    return true;
  } catch (error) {
    logError(`Failed to create payment order: ${error.message}`);
    return false;
  }
}

async function test5_GetDashboard() {
  logStep(5, 'Get Dashboard Overview');
  
  try {
    const response = await makeRequest('/patient/dashboard', 'GET', null, true);
    
    logSuccess('Dashboard retrieved successfully!');
    logSuccess(`Total Appointments: ${response.data.statistics.totalAppointments}`);
    logSuccess(`Upcoming Appointments: ${response.data.statistics.upcomingAppointments}`);
    logSuccess(`Total Spent: ₹${response.data.statistics.totalSpent}`);
    log(JSON.stringify(response, null, 2), 'yellow');
    
    return true;
  } catch (error) {
    logError(`Failed to get dashboard: ${error.message}`);
    return false;
  }
}

async function test6_GetAppointments() {
  logStep(6, 'Get All Appointments');
  
  try {
    const response = await makeRequest('/patient/appointments', 'GET', null, true);
    
    logSuccess('Appointments retrieved successfully!');
    logSuccess(`Total Appointments: ${response.data.appointments.length}`);
    
    if (response.data.appointments.length > 0) {
      const apt = response.data.appointments[0];
      logInfo(`Latest: ${apt.clinician_name} - ${apt.scheduled_start_at}`);
    }
    
    log(JSON.stringify(response, null, 2), 'yellow');
    
    return true;
  } catch (error) {
    logError(`Failed to get appointments: ${error.message}`);
    return false;
  }
}

async function test7_GetPayments() {
  logStep(7, 'Get Payment History');
  
  try {
    const response = await makeRequest('/patient/payments', 'GET', null, true);
    
    logSuccess('Payments retrieved successfully!');
    logSuccess(`Total Payments: ${response.data.payments.length}`);
    
    if (response.data.payments.length > 0) {
      const payment = response.data.payments[0];
      logInfo(`Latest: ₹${payment.amount} - ${payment.status}`);
    }
    
    log(JSON.stringify(response, null, 2), 'yellow');
    
    return true;
  } catch (error) {
    logError(`Failed to get payments: ${error.message}`);
    return false;
  }
}

async function test8_GetProfile() {
  logStep(8, 'Get Patient Profile');
  
  try {
    const response = await makeRequest('/patient/profile', 'GET', null, true);
    
    logSuccess('Profile retrieved successfully!');
    logSuccess(`Name: ${response.data.user.full_name}`);
    logSuccess(`Phone: ${response.data.user.phone}`);
    logSuccess(`Email: ${response.data.user.email || 'Not set'}`);
    log(JSON.stringify(response, null, 2), 'yellow');
    
    return true;
  } catch (error) {
    logError(`Failed to get profile: ${error.message}`);
    return false;
  }
}

async function test9_UpdateProfile() {
  logStep(9, 'Update Patient Profile');
  
  try {
    const response = await makeRequest('/patient/profile', 'PUT', {
      date_of_birth: '1990-01-01',
      gender: 'MALE',
      blood_group: 'O+',
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_phone: '919876543210',
    }, true);
    
    logSuccess('Profile updated successfully!');
    logSuccess(`DOB: ${response.data.profile.date_of_birth}`);
    logSuccess(`Gender: ${response.data.profile.gender}`);
    logSuccess(`Blood Group: ${response.data.profile.blood_group}`);
    log(JSON.stringify(response, null, 2), 'yellow');
    
    return true;
  } catch (error) {
    logError(`Failed to update profile: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('PRODUCTION BACKEND TESTING', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  logInfo(`Testing with phone: ${TEST_PHONE}`);
  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Make sure backend is running: npm run dev\n`);
  
  let results = {
    passed: 0,
    failed: 0,
  };
  
  // Test 1: Send OTP
  if (await test1_SendOTP()) {
    results.passed++;
    
    // Wait for user to enter OTP
    log('\n' + '-'.repeat(60), 'yellow');
    logInfo('Please check your WhatsApp and enter the OTP below:');
    log('-'.repeat(60) + '\n', 'yellow');
    
    // Read OTP from user input
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const otp = await new Promise(resolve => {
      readline.question('Enter OTP: ', answer => {
        readline.close();
        resolve(answer.trim());
      });
    });
    
    // Test 2: Verify OTP
    if (await test2_VerifyOTP(otp)) {
      results.passed++;
      
      // Test 3: Create Appointment
      if (await test3_CreateAppointment()) {
        results.passed++;
        
        // Test 4: Create Payment Order
        if (await test4_CreatePaymentOrder()) {
          results.passed++;
        } else {
          results.failed++;
        }
        
        // Test 5: Get Dashboard
        if (await test5_GetDashboard()) {
          results.passed++;
        } else {
          results.failed++;
        }
        
        // Test 6: Get Appointments
        if (await test6_GetAppointments()) {
          results.passed++;
        } else {
          results.failed++;
        }
        
        // Test 7: Get Payments
        if (await test7_GetPayments()) {
          results.passed++;
        } else {
          results.failed++;
        }
        
        // Test 8: Get Profile
        if (await test8_GetProfile()) {
          results.passed++;
        } else {
          results.failed++;
        }
        
        // Test 9: Update Profile
        if (await test9_UpdateProfile()) {
          results.passed++;
        } else {
          results.failed++;
        }
      } else {
        results.failed++;
      }
    } else {
      results.failed++;
    }
  } else {
    results.failed++;
  }
  
  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  log('='.repeat(60) + '\n', 'cyan');
  
  if (results.failed === 0) {
    logSuccess('🎉 All tests passed! Backend is working perfectly!');
  } else {
    logError('⚠️  Some tests failed. Check the errors above.');
  }
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
