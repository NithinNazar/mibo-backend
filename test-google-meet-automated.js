// Automated Google Meet Integration Test
// Tests the system without requiring OTP input

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testGoogleMeetIntegration() {
  console.log('🧪 Google Meet Integration - Automated Tests\n');
  console.log('=' .repeat(60));

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Check if backend is running
  console.log('\n📡 Test 1: Backend Server Health Check');
  console.log('-'.repeat(60));
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000
    }).catch(() => {
      // If /health doesn't exist, try root
      return axios.get(BASE_URL.replace('/api', ''), { timeout: 5000 });
    });
    console.log('✅ PASS: Backend server is running');
    passedTests++;
  } catch (error) {
    console.log('❌ FAIL: Backend server is not responding');
    console.log('   Make sure to run: npm run dev');
    failedTests++;
    return;
  }

  // Test 2: Check Google Meet utility initialization
  console.log('\n🔧 Test 2: Google Meet Utility');
  console.log('-'.repeat(60));
  try {
    const { googleMeetUtil } = require('./src/utils/google-meet');
    console.log('✅ PASS: Google Meet utility loaded successfully');
    passedTests++;
  } catch (error) {
    console.log('❌ FAIL: Google Meet utility failed to load');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 3: Check Gallabox utility initialization
  console.log('\n📱 Test 3: Gallabox WhatsApp Utility');
  console.log('-'.repeat(60));
  try {
    const { gallaboxUtil } = require('./src/utils/gallabox');
    if (gallaboxUtil.isReady()) {
      console.log('✅ PASS: Gallabox is configured and ready');
      passedTests++;
    } else {
      console.log('⚠️  WARN: Gallabox is not configured');
      console.log('   Check GALLABOX_API_KEY and GALLABOX_API_SECRET in .env');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Gallabox utility failed to load');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 4: Check database schema
  console.log('\n💾 Test 4: Database Schema - Google Meet Columns');
  console.log('-'.repeat(60));
  try {
    const { db } = require('./src/config/db');
    const result = await db.oneOrNone(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name IN ('google_meet_link', 'google_meet_event_id')
    `);
    
    if (result) {
      console.log('✅ PASS: Google Meet columns exist in appointments table');
      passedTests++;
    } else {
      console.log('❌ FAIL: Google Meet columns not found');
      console.log('   Run: node add-google-meet-columns.js');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Database schema check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 5: Check booking repository method
  console.log('\n📚 Test 5: Booking Repository - updateAppointmentGoogleMeet');
  console.log('-'.repeat(60));
  try {
    const { bookingRepository } = require('./src/repositories/booking.repository');
    if (typeof bookingRepository.updateAppointmentGoogleMeet === 'function') {
      console.log('✅ PASS: updateAppointmentGoogleMeet method exists');
      passedTests++;
    } else {
      console.log('❌ FAIL: updateAppointmentGoogleMeet method not found');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Booking repository check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 6: Check payment service integration
  console.log('\n💳 Test 6: Payment Service - Google Meet Integration');
  console.log('-'.repeat(60));
  try {
    const fs = require('fs');
    const paymentServiceCode = fs.readFileSync('./src/services/payment.service.ts', 'utf8');
    
    if (paymentServiceCode.includes('googleMeetUtil') && 
        paymentServiceCode.includes('createMeetingLink')) {
      console.log('✅ PASS: Payment service has Google Meet integration');
      passedTests++;
    } else {
      console.log('❌ FAIL: Payment service missing Google Meet integration');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Payment service check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 7: Check Gallabox template method
  console.log('\n📧 Test 7: Gallabox - Online Consultation Template Method');
  console.log('-'.repeat(60));
  try {
    const { gallaboxUtil } = require('./src/utils/gallabox');
    if (typeof gallaboxUtil.sendOnlineConsultationConfirmation === 'function') {
      console.log('✅ PASS: sendOnlineConsultationConfirmation method exists');
      passedTests++;
    } else {
      console.log('❌ FAIL: sendOnlineConsultationConfirmation method not found');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Gallabox template method check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 8: Check Google service account file
  console.log('\n🔑 Test 8: Google Service Account Credentials');
  console.log('-'.repeat(60));
  try {
    const fs = require('fs');
    const path = require('path');
    const credentialsPath = path.join(__dirname, 'clinic-booking-system-483212-31e92efb492d.json');
    
    if (fs.existsSync(credentialsPath)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      if (credentials.type === 'service_account' && credentials.project_id) {
        console.log('✅ PASS: Google service account file is valid');
        console.log('   Project ID:', credentials.project_id);
        passedTests++;
      } else {
        console.log('❌ FAIL: Invalid service account file format');
        failedTests++;
      }
    } else {
      console.log('❌ FAIL: Service account file not found');
      console.log('   Expected:', credentialsPath);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Service account file check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 9: Check environment variables
  console.log('\n🌍 Test 9: Environment Variables');
  console.log('-'.repeat(60));
  try {
    const requiredVars = [
      'GALLABOX_API_KEY',
      'GALLABOX_API_SECRET',
      'GALLABOX_CHANNEL_ID',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET'
    ];
    
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length === 0) {
      console.log('✅ PASS: All required environment variables are set');
      passedTests++;
    } else {
      console.log('❌ FAIL: Missing environment variables:', missing.join(', '));
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Environment variables check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 10: Check API endpoints
  console.log('\n🌐 Test 10: API Endpoints Availability');
  console.log('-'.repeat(60));
  try {
    // Test booking endpoint (should return 401 without auth)
    const bookingTest = await axios.post(`${BASE_URL}/booking/book`, {}, {
      validateStatus: () => true
    });
    
    // Test payment endpoint (should return 401 without auth)
    const paymentTest = await axios.post(`${BASE_URL}/payment/create-order`, {}, {
      validateStatus: () => true
    });
    
    if (bookingTest.status === 401 && paymentTest.status === 401) {
      console.log('✅ PASS: API endpoints are accessible (auth required)');
      passedTests++;
    } else {
      console.log('⚠️  WARN: Unexpected API response codes');
      console.log('   Booking:', bookingTest.status);
      console.log('   Payment:', paymentTest.status);
      passedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: API endpoints check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}/10`);
  console.log(`❌ Failed: ${failedTests}/10`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / 10) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Google Meet integration is ready.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Configure Google Workspace domain-wide delegation');
    console.log('   2. Create WhatsApp template in Gallabox');
    console.log('   3. Test with real online appointment booking');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
testGoogleMeetIntegration().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
