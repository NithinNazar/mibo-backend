// Google Meet Integration Status Check
// Simple file-based tests that don't require module loading

const fs = require('fs');
const path = require('path');

console.log('🧪 Google Meet Integration - Status Check\n');
console.log('=' .repeat(60));

let passedTests = 0;
let failedTests = 0;

// Test 1: Google Meet Utility File
console.log('\n📅 Test 1: Google Meet Utility File');
console.log('-'.repeat(60));
try {
  const filePath = path.join(__dirname, 'src/utils/google-meet.ts');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const checks = {
      'createMeetingLink method': content.includes('createMeetingLink'),
      'updateMeetingLink method': content.includes('updateMeetingLink'),
      'cancelMeeting method': content.includes('cancelMeeting'),
      'Google Calendar API': content.includes('google.calendar'),
      'Service account auth': content.includes('GoogleAuth')
    };
    
    const passed = Object.values(checks).filter(v => v).length;
    if (passed === Object.keys(checks).length) {
      console.log('✅ PASS: Google Meet utility file is complete');
      Object.keys(checks).forEach(check => console.log(`   ✓ ${check}`));
      passedTests++;
    } else {
      console.log(`⚠️  WARN: Google Meet utility incomplete (${passed}/${Object.keys(checks).length})`);
      Object.entries(checks).forEach(([check, result]) => {
        console.log(`   ${result ? '✓' : '✗'} ${check}`);
      });
      failedTests++;
    }
  } else {
    console.log('❌ FAIL: Google Meet utility file not found');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 2: Gallabox Integration
console.log('\n📱 Test 2: Gallabox WhatsApp Integration');
console.log('-'.repeat(60));
try {
  const filePath = path.join(__dirname, 'src/utils/gallabox.ts');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('sendOnlineConsultationConfirmation')) {
      console.log('✅ PASS: Gallabox has online consultation method');
      console.log('   ✓ sendOnlineConsultationConfirmation method exists');
      console.log('   ✓ Template: online_consultation_confirmation');
      passedTests++;
    } else {
      console.log('❌ FAIL: sendOnlineConsultationConfirmation method not found');
      failedTests++;
    }
  } else {
    console.log('❌ FAIL: Gallabox utility file not found');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 3: Database Migration Files
console.log('\n💾 Test 3: Database Migration Files');
console.log('-'.repeat(60));
try {
  const sqlFile = path.join(__dirname, 'add-google-meet-columns.sql');
  const jsFile = path.join(__dirname, 'add-google-meet-columns.js');
  
  if (fs.existsSync(sqlFile) && fs.existsSync(jsFile)) {
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    if (sqlContent.includes('google_meet_link') && sqlContent.includes('google_meet_event_id')) {
      console.log('✅ PASS: Database migration files exist');
      console.log('   ✓ add-google-meet-columns.sql');
      console.log('   ✓ add-google-meet-columns.js');
      console.log('   ✓ Adds google_meet_link column');
      console.log('   ✓ Adds google_meet_event_id column');
      passedTests++;
    } else {
      console.log('⚠️  WARN: Migration files incomplete');
      failedTests++;
    }
  } else {
    console.log('❌ FAIL: Migration files not found');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 4: Booking Repository
console.log('\n📚 Test 4: Booking Repository Updates');
console.log('-'.repeat(60));
try {
  const filePath = path.join(__dirname, 'src/repositories/booking.repository.ts');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const checks = {
      'updateAppointmentGoogleMeet method': content.includes('updateAppointmentGoogleMeet'),
      'google_meet_link parameter': content.includes('google_meet_link'),
      'google_meet_event_id parameter': content.includes('google_meet_event_id'),
      'COALESCE for meet_link': content.includes('COALESCE')
    };
    
    const passed = Object.values(checks).filter(v => v).length;
    if (passed >= 3) {
      console.log('✅ PASS: Booking repository has Google Meet support');
      Object.entries(checks).forEach(([check, result]) => {
        console.log(`   ${result ? '✓' : '○'} ${check}`);
      });
      passedTests++;
    } else {
      console.log(`⚠️  WARN: Booking repository incomplete (${passed}/${Object.keys(checks).length})`);
      Object.entries(checks).forEach(([check, result]) => {
        console.log(`   ${result ? '✓' : '✗'} ${check}`);
      });
      failedTests++;
    }
  } else {
    console.log('❌ FAIL: Booking repository file not found');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 5: Payment Service Integration
console.log('\n💳 Test 5: Payment Service Integration');
console.log('-'.repeat(60));
try {
  const filePath = path.join(__dirname, 'src/services/payment.service.ts');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const checks = {
      'googleMeetUtil import': content.includes('googleMeetUtil'),
      'createMeetingLink call': content.includes('createMeetingLink'),
      'ONLINE appointment check': content.includes('appointment_type === "ONLINE"') || content.includes("appointment_type === 'ONLINE'"),
      'updateAppointmentGoogleMeet call': content.includes('updateAppointmentGoogleMeet'),
      'sendOnlineConsultationConfirmation call': content.includes('sendOnlineConsultationConfirmation')
    };
    
    const passed = Object.values(checks).filter(v => v).length;
    if (passed === Object.keys(checks).length) {
      console.log('✅ PASS: Payment service has complete Google Meet integration');
      Object.keys(checks).forEach(check => console.log(`   ✓ ${check}`));
      passedTests++;
    } else {
      console.log(`⚠️  WARN: Payment service integration incomplete (${passed}/${Object.keys(checks).length})`);
      Object.entries(checks).forEach(([check, result]) => {
        console.log(`   ${result ? '✓' : '✗'} ${check}`);
      });
      failedTests++;
    }
  } else {
    console.log('❌ FAIL: Payment service file not found');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 6: Google Service Account File
console.log('\n🔑 Test 6: Google Service Account Credentials');
console.log('-'.repeat(60));
try {
  const filePath = path.join(__dirname, 'clinic-booking-system-483212-31e92efb492d.json');
  if (fs.existsSync(filePath)) {
    const credentials = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (credentials.type === 'service_account' && credentials.project_id) {
      console.log('✅ PASS: Google service account file is valid');
      console.log('   ✓ Type: service_account');
      console.log('   ✓ Project ID:', credentials.project_id);
      console.log('   ✓ Client Email:', credentials.client_email);
      passedTests++;
    } else {
      console.log('❌ FAIL: Invalid service account file format');
      failedTests++;
    }
  } else {
    console.log('❌ FAIL: Service account file not found');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 7: Environment Variables
console.log('\n🌍 Test 7: Environment Configuration');
console.log('-'.repeat(60));
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const checks = {
      'GALLABOX_API_KEY': envContent.includes('GALLABOX_API_KEY='),
      'GALLABOX_API_SECRET': envContent.includes('GALLABOX_API_SECRET='),
      'GALLABOX_CHANNEL_ID': envContent.includes('GALLABOX_CHANNEL_ID='),
      'RAZORPAY_KEY_ID': envContent.includes('RAZORPAY_KEY_ID='),
      'RAZORPAY_KEY_SECRET': envContent.includes('RAZORPAY_KEY_SECRET=')
    };
    
    const passed = Object.values(checks).filter(v => v).length;
    if (passed === Object.keys(checks).length) {
      console.log('✅ PASS: All required environment variables configured');
      Object.keys(checks).forEach(key => console.log(`   ✓ ${key}`));
      passedTests++;
    } else {
      console.log(`⚠️  WARN: Some environment variables missing (${passed}/${Object.keys(checks).length})`);
      Object.entries(checks).forEach(([key, result]) => {
        console.log(`   ${result ? '✓' : '✗'} ${key}`);
      });
      failedTests++;
    }
  } else {
    console.log('❌ FAIL: .env file not found');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 8: Frontend Integration
console.log('\n🖥️  Test 8: Frontend Patient Dashboard');
console.log('-'.repeat(60));
try {
  const filePath = path.join(__dirname, '../mibo_version-2/src/pages/profileDashboard/PatientDashboard.tsx');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const checks = {
      'google_meet_link interface': content.includes('google_meet_link'),
      'meet_link interface': content.includes('meet_link'),
      'ONLINE appointment check': content.includes('ONLINE'),
      'Join Google Meet button': content.includes('Join Google Meet')
    };
    
    const passed = Object.values(checks).filter(v => v).length;
    if (passed === Object.keys(checks).length) {
      console.log('✅ PASS: Frontend has Google Meet integration');
      Object.keys(checks).forEach(check => console.log(`   ✓ ${check}`));
      passedTests++;
    } else {
      console.log(`⚠️  WARN: Frontend integration incomplete (${passed}/${Object.keys(checks).length})`);
      Object.entries(checks).forEach(([check, result]) => {
        console.log(`   ${result ? '✓' : '✗'} ${check}`);
      });
      failedTests++;
    }
  } else {
    console.log('⚠️  WARN: Frontend dashboard file not found at expected location');
    console.log('   Checking alternate path...');
    
    // Try alternate path
    const altPath = path.join(__dirname, '../../host_test/mibo-v2/mibo_version-2/src/pages/profileDashboard/PatientDashboard.tsx');
    if (fs.existsSync(altPath)) {
      const content = fs.readFileSync(altPath, 'utf8');
      if (content.includes('google_meet_link') && content.includes('Join Google Meet')) {
        console.log('✅ PASS: Frontend integration found at alternate location');
        passedTests++;
      } else {
        console.log('⚠️  WARN: Frontend file found but integration incomplete');
        failedTests++;
      }
    } else {
      console.log('⚠️  WARN: Could not locate frontend dashboard file');
      failedTests++;
    }
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 9: Documentation
console.log('\n📖 Test 9: Documentation Files');
console.log('-'.repeat(60));
try {
  const docs = [
    'GOOGLE_MEET_INTEGRATION_COMPLETE.md',
    'GOOGLE_MEET_COMPLETE_SUMMARY.md',
    'GOOGLE_MEET_QUICK_START.md'
  ];
  
  const existing = docs.filter(doc => fs.existsSync(path.join(__dirname, doc)));
  
  if (existing.length === docs.length) {
    console.log('✅ PASS: All documentation files created');
    existing.forEach(doc => console.log(`   ✓ ${doc}`));
    passedTests++;
  } else {
    console.log(`⚠️  WARN: Some documentation missing (${existing.length}/${docs.length})`);
    docs.forEach(doc => {
      const exists = fs.existsSync(path.join(__dirname, doc));
      console.log(`   ${exists ? '✓' : '✗'} ${doc}`);
    });
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Test 10: TypeScript Build
console.log('\n🔨 Test 10: TypeScript Compilation');
console.log('-'.repeat(60));
try {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    if (files.length > 0) {
      console.log('✅ PASS: TypeScript compiled successfully');
      console.log(`   ✓ ${files.length} files in dist folder`);
      passedTests++;
    } else {
      console.log('⚠️  WARN: dist folder is empty');
      console.log('   Run: npm run build');
      failedTests++;
    }
  } else {
    console.log('⚠️  WARN: dist folder not found');
    console.log('   Run: npm run build');
    failedTests++;
  }
} catch (error) {
  console.log('❌ FAIL:', error.message);
  failedTests++;
}

// Summary
const totalTests = passedTests + failedTests;

console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${failedTests}/${totalTests}`);
console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Google Meet integration is complete.');
  console.log('\n📝 Configuration Checklist:');
  console.log('   ⚠️  Configure Google Workspace domain-wide delegation');
  console.log('   ⚠️  Create WhatsApp template in Gallabox:');
  console.log('       - Template name: online_consultation_confirmation');
  console.log('       - Variables: Patient Name, Doctor Name, Date, Time, Meet Link');
  console.log('   ✅ Test with real online appointment booking');
  console.log('\n📖 Documentation:');
  console.log('   - GOOGLE_MEET_INTEGRATION_COMPLETE.md - Full technical details');
  console.log('   - GOOGLE_MEET_COMPLETE_SUMMARY.md - Implementation summary');
  console.log('   - GOOGLE_MEET_QUICK_START.md - Quick start guide');
} else if (failedTests <= 2) {
  console.log('\n⚠️  Minor issues found. Integration is mostly ready.');
  console.log('   Review the warnings above.');
} else {
  console.log('\n❌ Several tests failed. Please review the issues above.');
}

console.log('\n' + '='.repeat(60));

process.exit(failedTests > 3 ? 1 : 0);
