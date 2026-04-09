// Test script for Slot Blocking API
// Run with: node test-slot-blocking-api.js

const BASE_URL = process.env.API_URL || "http://localhost:5000/api";

// Replace these with actual tokens from your system
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "YOUR_ADMIN_TOKEN_HERE";
const PATIENT_TOKEN = process.env.PATIENT_TOKEN || "YOUR_PATIENT_TOKEN_HERE";

// Test data - adjust these IDs based on your database
const TEST_CLINICIAN_ID = 1;
const TEST_CENTRE_ID = 1;
const TEST_DATE = "2024-12-25"; // Use a future date

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(endpoint, method = "GET", body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  log("\n🚀 Starting Slot Blocking API Tests\n", "cyan");
  log(`Base URL: ${BASE_URL}`, "blue");
  log(`Test Date: ${TEST_DATE}\n`, "blue");

  let testsPassed = 0;
  let testsFailed = 0;
  let blockedSlotId = null;

  // Test 1: Block a single slot
  log("Test 1: Block a single slot", "yellow");
  const blockResult = await makeRequest(
    "/admin/slots/block",
    "POST",
    {
      clinician_id: TEST_CLINICIAN_ID,
      centre_id: TEST_CENTRE_ID,
      date: TEST_DATE,
      start_time: "10:00:00",
      end_time: "10:30:00",
      reason: "API Test - Doctor unavailable",
    },
    ADMIN_TOKEN
  );

  if (blockResult.status === 200 && blockResult.data.success) {
    log("✅ PASSED: Slot blocked successfully", "green");
    blockedSlotId = blockResult.data.data.blocked_slot.id;
    log(`   Blocked Slot ID: ${blockedSlotId}`, "blue");
    log(
      `   Affected Patients: ${blockResult.data.data.affected_patients.length}`,
      "blue"
    );
    testsPassed++;
  } else {
    log(`❌ FAILED: ${JSON.stringify(blockResult.data)}`, "red");
    testsFailed++;
  }

  // Test 2: Try to block the same slot again (should fail)
  log("\nTest 2: Try to block same slot again (should fail)", "yellow");
  const duplicateResult = await makeRequest(
    "/admin/slots/block",
    "POST",
    {
      clinician_id: TEST_CLINICIAN_ID,
      centre_id: TEST_CENTRE_ID,
      date: TEST_DATE,
      start_time: "10:00:00",
      end_time: "10:30:00",
      reason: "Duplicate test",
    },
    ADMIN_TOKEN
  );

  if (duplicateResult.status === 409) {
    log("✅ PASSED: Duplicate blocking prevented", "green");
    testsPassed++;
  } else {
    log(`❌ FAILED: Should have returned 409 conflict`, "red");
    testsFailed++;
  }

  // Test 3: Block multiple slots
  log("\nTest 3: Block multiple slots", "yellow");
  const multipleResult = await makeRequest(
    "/admin/slots/block-multiple",
    "POST",
    {
      slots: [
        {
          clinician_id: TEST_CLINICIAN_ID,
          centre_id: TEST_CENTRE_ID,
          date: TEST_DATE,
          start_time: "11:00:00",
          end_time: "11:30:00",
        },
        {
          clinician_id: TEST_CLINICIAN_ID,
          centre_id: TEST_CENTRE_ID,
          date: TEST_DATE,
          start_time: "11:30:00",
          end_time: "12:00:00",
        },
      ],
      reason: "API Test - Multiple slots",
    },
    ADMIN_TOKEN
  );

  if (multipleResult.status === 200 && multipleResult.data.success) {
    log("✅ PASSED: Multiple slots blocked", "green");
    log(
      `   Blocked: ${multipleResult.data.data.blocked_count} slots`,
      "blue"
    );
    log(`   Failed: ${multipleResult.data.data.failed_count} slots`, "blue");
    testsPassed++;
  } else {
    log(`❌ FAILED: ${JSON.stringify(multipleResult.data)}`, "red");
    testsFailed++;
  }

  // Test 4: Get blocked slots
  log("\nTest 4: Get blocked slots", "yellow");
  const getBlockedResult = await makeRequest(
    `/admin/slots/blocked?clinician_id=${TEST_CLINICIAN_ID}`,
    "GET",
    null,
    ADMIN_TOKEN
  );

  if (getBlockedResult.status === 200 && getBlockedResult.data.success) {
    log("✅ PASSED: Retrieved blocked slots", "green");
    log(
      `   Total blocked slots: ${getBlockedResult.data.data.total}`,
      "blue"
    );
    testsPassed++;
  } else {
    log(`❌ FAILED: ${JSON.stringify(getBlockedResult.data)}`, "red");
    testsFailed++;
  }

  // Test 5: Get affected patients (preview)
  log("\nTest 5: Get affected patients preview", "yellow");
  const affectedResult = await makeRequest(
    "/admin/slots/affected-patients",
    "POST",
    {
      slots: [
        {
          clinician_id: TEST_CLINICIAN_ID,
          centre_id: TEST_CENTRE_ID,
          date: TEST_DATE,
          start_time: "14:00:00",
          end_time: "14:30:00",
        },
      ],
    },
    ADMIN_TOKEN
  );

  if (affectedResult.status === 200 && affectedResult.data.success) {
    log("✅ PASSED: Retrieved affected patients", "green");
    log(
      `   Affected patients: ${affectedResult.data.data.total_count}`,
      "blue"
    );
    testsPassed++;
  } else {
    log(`❌ FAILED: ${JSON.stringify(affectedResult.data)}`, "red");
    testsFailed++;
  }

  // Test 6: Unblock a slot
  if (blockedSlotId) {
    log("\nTest 6: Unblock a slot", "yellow");
    const unblockResult = await makeRequest(
      `/admin/slots/unblock/${blockedSlotId}`,
      "POST",
      null,
      ADMIN_TOKEN
    );

    if (unblockResult.status === 200 && unblockResult.data.success) {
      log("✅ PASSED: Slot unblocked successfully", "green");
      testsPassed++;
    } else {
      log(`❌ FAILED: ${JSON.stringify(unblockResult.data)}`, "red");
      testsFailed++;
    }
  }

  // Test 7: Try to block past slot (should fail)
  log("\nTest 7: Try to block past slot (should fail)", "yellow");
  const pastSlotResult = await makeRequest(
    "/admin/slots/block",
    "POST",
    {
      clinician_id: TEST_CLINICIAN_ID,
      centre_id: TEST_CENTRE_ID,
      date: "2023-01-01",
      start_time: "10:00:00",
      end_time: "10:30:00",
      reason: "Past date test",
    },
    ADMIN_TOKEN
  );

  if (pastSlotResult.status === 400) {
    log("✅ PASSED: Past slot blocking prevented", "green");
    testsPassed++;
  } else {
    log(`❌ FAILED: Should have returned 400 error`, "red");
    testsFailed++;
  }

  // Test 8: Get patient notifications
  log("\nTest 8: Get patient notifications", "yellow");
  const notificationsResult = await makeRequest(
    "/patient/notifications?limit=10",
    "GET",
    null,
    PATIENT_TOKEN
  );

  if (notificationsResult.status === 200 && notificationsResult.data.success) {
    log("✅ PASSED: Retrieved patient notifications", "green");
    log(
      `   Total notifications: ${notificationsResult.data.data.total}`,
      "blue"
    );
    log(
      `   Unread count: ${notificationsResult.data.data.unread_count}`,
      "blue"
    );
    testsPassed++;
  } else {
    log(`❌ FAILED: ${JSON.stringify(notificationsResult.data)}`, "red");
    testsFailed++;
  }

  // Test 9: Get unread notification count
  log("\nTest 9: Get unread notification count", "yellow");
  const unreadCountResult = await makeRequest(
    "/patient/notifications/unread-count",
    "GET",
    null,
    PATIENT_TOKEN
  );

  if (unreadCountResult.status === 200 && unreadCountResult.data.success) {
    log("✅ PASSED: Retrieved unread count", "green");
    log(
      `   Unread count: ${unreadCountResult.data.data.unread_count}`,
      "blue"
    );
    testsPassed++;
  } else {
    log(`❌ FAILED: ${JSON.stringify(unreadCountResult.data)}`, "red");
    testsFailed++;
  }

  // Test 10: Test without authentication (should fail)
  log("\nTest 10: Test without authentication (should fail)", "yellow");
  const noAuthResult = await makeRequest("/admin/slots/blocked", "GET");

  if (noAuthResult.status === 401) {
    log("✅ PASSED: Authentication required", "green");
    testsPassed++;
  } else {
    log(`❌ FAILED: Should have returned 401 unauthorized`, "red");
    testsFailed++;
  }

  // Summary
  log("\n" + "=".repeat(50), "cyan");
  log("📊 Test Summary", "cyan");
  log("=".repeat(50), "cyan");
  log(`✅ Tests Passed: ${testsPassed}`, "green");
  log(`❌ Tests Failed: ${testsFailed}`, "red");
  log(
    `📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`,
    "blue"
  );
  log("=".repeat(50) + "\n", "cyan");

  if (testsFailed === 0) {
    log("🎉 All tests passed!", "green");
  } else {
    log("⚠️  Some tests failed. Please review the errors above.", "yellow");
  }
}

// Check if tokens are set
if (ADMIN_TOKEN === "YOUR_ADMIN_TOKEN_HERE") {
  log(
    "\n⚠️  WARNING: Please set ADMIN_TOKEN environment variable or update the script",
    "yellow"
  );
  log(
    "   Example: ADMIN_TOKEN=your_token node test-slot-blocking-api.js\n",
    "blue"
  );
}

if (PATIENT_TOKEN === "YOUR_PATIENT_TOKEN_HERE") {
  log(
    "⚠️  WARNING: Please set PATIENT_TOKEN environment variable or update the script",
    "yellow"
  );
  log(
    "   Example: PATIENT_TOKEN=your_token node test-slot-blocking-api.js\n",
    "blue"
  );
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test execution failed: ${error.message}`, "red");
  process.exit(1);
});
