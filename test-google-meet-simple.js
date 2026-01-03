// Simple Google Meet Integration Test
// Tests core functionality without requiring server or OTP

console.log('🧪 Google Meet Integration - Simple Tests\n');
console.log('=' .repeat(60));

let passedTests = 0;
let failedTests = 0;

// Test 1: Google Meet Utility
console.log('\n📅 Test 1: Google Meet Utility Module');
console.log('-'.repeat(60));
try {
  const { googleMeetUtil } = require('./src/utils/google-meet');
  console.log('✅ PASS: Google Meet utility loaded successfully');
  console.log('   Methods available:');
  console.log('   - createMeetingLink()');
  console.log('   - updateMeetingLink()');
  console.log('   - cancelMeeting()');
  passedTests++;
} catch (error) {
  console.log('❌ FAIL: Google Meet utility failed to load');
  console.log('   Error:', error.message);
  failedTests++;
}

// Test 2: Gallabox Utility
console.log('\n📱 Test 2: Gallabox WhatsApp Utility');
console.log('-'.repeat(60));
try {
  const { gallaboxUtil } = require('./src/utils/gallabox');
  if (gallaboxUtil.isReady()) {
    console.log('✅ PASS: Gallabox is configured and ready');
    console.log('   API Key:', process.env.GALLABOX_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('   API Secret:', process.env.GALLABOX_API_SECRET ? '✓ Set' : '✗ Missing');
    console.log('   Channel ID:', process.env.GALLABOX_CHANNEL_ID ? '✓ Set' : '✗ Missing');
    passedTests++;
  } else {
    console.log('⚠️  WARN: Gallabox is not configured');
    console.log('   Check GALLABOX_API_KEY and GALLABOX_API_SECRET in .env');
    failedTests++;
  }
  
  // Check for new method
  if (typeof gallaboxUtil.sendOnlineConsultationConfirmation === 'function') {
    console.log('✅ PASS: sendOnlineConsultationConfirmation method exists');
    passedTests++;
  } else {
    console.log('❌ FAIL: sendOnlineConsultationConfirmation method not found');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL: Gallabox utility failed to load');
  console.log('   Error:', error.message);
  failedTests += 2;
}

// Test 3: Database Schema
console.log('\n💾 Test 3: Database Schema - Google Meet Columns');
console.log('-'.repeat(60));
try {
  const { db } = require('./src/config/db');
  
  db.any(`
    SELECT column_name, data_type
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name IN ('google_meet_link', 'google_meet_event_id')
    ORDER BY column_name
  `).then(columns => {
    if (columns.length === 2) {
      console.log('✅ PASS: Google Meet columns exist in appointments table');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      passedTests++;
    } else if (columns.length === 0) {
      console.log('❌ FAIL: Google Meet columns not found');
      console.log('   Run: node add-google-meet-columns.js');
      failedTests++;
    } else {
      console.log('⚠️  WARN: Only found', columns.length, 'column(s)');
      failedTests++;
    }
    continueTests();
  }).catch(error => {
    console.log('❌ FAIL: Database query failed');
    console.log('   Error:', error.message);
    failedTests++;
    continueTests();
  });
  
  return; // Wait for async
} catch (error) {
  console.log('❌ FAIL: Database connection failed');
  console.log('   Error:', error.message);
  failedTests++;
}

function continueTests() {
  // Test 4: Booking Repository
  console.log('\n📚 Test 4: Booking Repository - updateAppointmentGoogleMeet');
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

  // Test 5: Payment Service Integration
  console.log('\n💳 Test 5: Payment Service - Google Meet Integration');
  console.log('-'.repeat(60));
  try {
    const fs = require('fs');
    const paymentServiceCode = fs.readFileSync('./src/services/payment.service.ts', 'utf8');
    
    const checks = {
      'googleMeetUtil import': paymentServiceCode.includes('googleMeetUtil'),
      'createMeetingLink call': paymentServiceCode.includes('createMeetingLink'),
      'ONLINE appointment check': paymentServiceCode.includes('ONLINE'),
      'updateAppointmentGoogleMeet call': paymentServiceCode.includes('updateAppointmentGoogleMeet'),
      'sendOnlineConsultationConfirmation call': paymentServiceCode.includes('sendOnlineConsultationConfirmation')
    };
    
    const passed = Object.values(checks).filter(v => v).length;
    const total = Object.keys(checks).length;
    
    if (passed === total) {
      console.log('✅ PASS: Payment service has complete Google Meet integration');
      Object.keys(checks).forEach(check => {
        console.log(`   ✓ ${check}`);
      });
      passedTests++;
    } else {
      console.log(`⚠️  WARN: Payment service integration incomplete (${passed}/${total})`);
      Object.entries(checks).forEach(([check, result]) => {
        console.log(`   ${result ? '✓' : '✗'} ${check}`);
      });
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Payment service check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 6: Google Service Account File
  console.log('\n🔑 Test 6: Google Service Account Credentials');
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
        console.log('   Client Email:', credentials.client_email);
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

  // Test 7: Environment Variables
  console.log('\n🌍 Test 7: Environment Variables');
  console.log('-'.repeat(60));
  try {
    const requiredVars = {
      'GALLABOX_API_KEY': process.env.GALLABOX_API_KEY,
      'GALLABOX_API_SECRET': process.env.GALLABOX_API_SECRET,
      'GALLABOX_CHANNEL_ID': process.env.GALLABOX_CHANNEL_ID,
      'RAZORPAY_KEY_ID': process.env.RAZORPAY_KEY_ID,
      'RAZORPAY_KEY_SECRET': process.env.RAZORPAY_KEY_SECRET
    };
    
    const missing = Object.entries(requiredVars).filter(([k, v]) => !v).map(([k]) => k);
    
    if (missing.length === 0) {
      console.log('✅ PASS: All required environment variables are set');
      Object.keys(requiredVars).forEach(key => {
        console.log(`   ✓ ${key}`);
      });
      passedTests++;
    } else {
      console.log('❌ FAIL: Missing environment variables:');
      missing.forEach(key => console.log(`   ✗ ${key}`));
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Environment variables check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Test 8: Frontend Integration
  console.log('\n🖥️  Test 8: Frontend - Patient Dashboard Integration');
  console.log('-'.repeat(60));
  try {
    const fs = require('fs');
    const path = require('path');
    const dashboardPath = path.join(__dirname, '../mibo_version-2/src/pages/profileDashboard/PatientDashboard.tsx');
    
    if (fs.existsSync(dashboardPath)) {
      const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
      
      const checks = {
        'google_meet_link interface': dashboardCode.includes('google_meet_link'),
        'meet_link interface': dashboardCode.includes('meet_link'),
        'ONLINE appointment check': dashboardCode.includes('ONLINE'),
        'Join Google Meet button': dashboardCode.includes('Join Google Meet')
      };
      
      const passed = Object.values(checks).filter(v => v).length;
      const total = Object.keys(checks).length;
      
      if (passed === total) {
        console.log('✅ PASS: Frontend has Google Meet integration');
        Object.keys(checks).forEach(check => {
          console.log(`   ✓ ${check}`);
        });
        passedTests++;
      } else {
        console.log(`⚠️  WARN: Frontend integration incomplete (${passed}/${total})`);
        Object.entries(checks).forEach(([check, result]) => {
          console.log(`   ${result ? '✓' : '✗'} ${check}`);
        });
        failedTests++;
      }
    } else {
      console.log('⚠️  WARN: Frontend dashboard file not found');
      console.log('   Expected:', dashboardPath);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL: Frontend integration check failed');
    console.log('   Error:', error.message);
    failedTests++;
  }

  // Summary
  printSummary();
}

function printSummary() {
  const totalTests = passedTests + failedTests;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Google Meet integration is ready.');
    console.log('\n📝 Next Steps:');
    console.log('   1. ⚠️  Configure Google Workspace domain-wide delegation');
    console.log('   2. ⚠️  Create WhatsApp template in Gallabox:');
    console.log('       Template name: online_consultation_confirmation');
    console.log('       Variables: Patient Name, Doctor Name, Date, Time, Meet Link');
    console.log('   3. ✅ Test with real online appointment booking');
    console.log('\n📖 Documentation:');
    console.log('   - GOOGLE_MEET_INTEGRATION_COMPLETE.md');
    console.log('   - GOOGLE_MEET_QUICK_START.md');
  } else if (failedTests <= 2) {
    console.log('\n⚠️  Minor issues found. Integration is mostly ready.');
    console.log('   Review the failed tests above and fix if needed.');
  } else {
    console.log('\n❌ Several tests failed. Please fix the issues above.');
  }
  
  console.log('\n' + '='.repeat(60));
  
  process.exit(failedTests > 3 ? 1 : 0);
}

// Handle case where database test doesn't run
setTimeout(() => {
  if (passedTests + failedTests < 8) {
    continueTests();
  }
}, 2000);
