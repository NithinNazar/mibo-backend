/**
 * Quick Backend Test (No User Input Required)
 * 
 * Tests endpoints that don't require authentication:
 * - Health check
 * - Send OTP
 * - Available slots
 * 
 * Run: node test-quick.js
 */

const BASE_URL = 'http://localhost:5000/api';
const TEST_PHONE = '919048810697';

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n=== Testing Health Check ===', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      log('✓ Health check passed', 'green');
      log(`  Status: ${data.status}`, 'yellow');
      return true;
    } else {
      log('✗ Health check failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Health check error: ${error.message}`, 'red');
    return false;
  }
}

async function testRootEndpoint() {
  log('\n=== Testing Root Endpoint ===', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/`);
    const data = await response.json();
    
    if (response.ok && data.message) {
      log('✓ Root endpoint passed', 'green');
      log(`  Message: ${data.message}`, 'yellow');
      log(`  Version: ${data.version}`, 'yellow');
      log(`  Environment: ${data.environment}`, 'yellow');
      return true;
    } else {
      log('✗ Root endpoint failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Root endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function testSendOTP() {
  log('\n=== Testing Send OTP ===', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/patient-auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: TEST_PHONE,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log('✓ Send OTP passed', 'green');
      log(`  Message: ${data.message}`, 'yellow');
      log(`  Phone: ${TEST_PHONE}`, 'yellow');
      log('  ℹ Check WhatsApp for OTP!', 'cyan');
      return true;
    } else {
      log('✗ Send OTP failed', 'red');
      log(`  Error: ${data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Send OTP error: ${error.message}`, 'red');
    return false;
  }
}

async function testAvailableSlots() {
  log('\n=== Testing Available Slots (Public) ===', 'cyan');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];
    
    const url = `${BASE_URL}/booking/available-slots?clinicianId=1&centreId=1&date=${date}&type=ONLINE`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      log('✓ Available slots passed', 'green');
      log(`  Date: ${date}`, 'yellow');
      
      if (data.data && data.data.slots) {
        log(`  Available slots: ${data.data.slots.length}`, 'yellow');
        if (data.data.slots.length > 0) {
          log(`  First slot: ${data.data.slots[0]}`, 'yellow');
        }
      }
      return true;
    } else {
      log('✗ Available slots failed', 'red');
      log(`  Error: ${data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Available slots error: ${error.message}`, 'red');
    return false;
  }
}

async function testInvalidEndpoint() {
  log('\n=== Testing Invalid Endpoint (Should Fail) ===', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/invalid-endpoint`);
    
    if (response.status === 404) {
      log('✓ Invalid endpoint correctly returns 404', 'green');
      return true;
    } else {
      log('✗ Invalid endpoint should return 404', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Invalid endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function testMissingAuth() {
  log('\n=== Testing Protected Endpoint Without Auth (Should Fail) ===', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/patient/dashboard`);
    const data = await response.json();
    
    if (response.status === 401) {
      log('✓ Protected endpoint correctly requires auth', 'green');
      log(`  Message: ${data.message}`, 'yellow');
      return true;
    } else {
      log('✗ Protected endpoint should return 401', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Protected endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('QUICK BACKEND TEST', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nBase URL: ${BASE_URL}`, 'yellow');
  log(`Test Phone: ${TEST_PHONE}\n`, 'yellow');
  
  const results = {
    passed: 0,
    failed: 0,
  };
  
  // Run tests
  const tests = [
    testHealthCheck,
    testRootEndpoint,
    testSendOTP,
    testAvailableSlots,
    testInvalidEndpoint,
    testMissingAuth,
  ];
  
  for (const test of tests) {
    if (await test()) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`✓ Passed: ${results.passed}`, 'green');
  
  if (results.failed > 0) {
    log(`✗ Failed: ${results.failed}`, 'red');
  }
  
  log('='.repeat(60) + '\n', 'cyan');
  
  if (results.failed === 0) {
    log('🎉 All quick tests passed!', 'green');
    log('ℹ  Run "node test-production-flow.js" for complete testing', 'cyan');
  } else {
    log('⚠️  Some tests failed. Check errors above.', 'red');
  }
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
