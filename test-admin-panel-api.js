// Test script for admin panel API endpoints
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "Admin@123",
};

let accessToken = "";

async function login() {
  try {
    console.log("🔐 Logging in as admin...");
    const response = await axios.post(
      `${BASE_URL}/auth/login/username-password`,
      {
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password,
      }
    );

    if (response.data.success) {
      accessToken = response.data.data.accessToken;
      console.log("✅ Login successful");
      console.log(`Token: ${accessToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    return false;
  }
}

async function testDashboardMetrics() {
  try {
    console.log("\n📊 Testing dashboard metrics...");
    const response = await axios.get(`${BASE_URL}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("✅ Dashboard metrics:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "❌ Dashboard metrics failed:",
      error.response?.data || error.message
    );
  }
}

async function testClinicians() {
  try {
    console.log("\n👨‍⚕️ Testing clinicians list...");
    const response = await axios.get(`${BASE_URL}/users/clinicians`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log(`✅ Found ${response.data.data?.length || 0} clinicians`);
    if (response.data.data && response.data.data.length > 0) {
      console.log("First 3 clinicians:");
      response.data.data.slice(0, 3).forEach((clinician) => {
        console.log(`  - ${clinician.name} (${clinician.specialization})`);
      });
    }
  } catch (error) {
    console.error(
      "❌ Clinicians list failed:",
      error.response?.data || error.message
    );
  }
}

async function testCentres() {
  try {
    console.log("\n🏥 Testing centres list...");
    const response = await axios.get(`${BASE_URL}/centres`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log(`✅ Found ${response.data.data?.length || 0} centres`);
    if (response.data.data && response.data.data.length > 0) {
      console.log("Centres:");
      response.data.data.forEach((centre) => {
        console.log(`  - ${centre.name} (${centre.city})`);
      });
    }
  } catch (error) {
    console.error(
      "❌ Centres list failed:",
      error.response?.data || error.message
    );
  }
}

async function testTopDoctors() {
  try {
    console.log("\n⭐ Testing top doctors...");
    const response = await axios.get(`${BASE_URL}/analytics/top-doctors`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("✅ Top doctors:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "❌ Top doctors failed:",
      error.response?.data || error.message
    );
  }
}

async function testRevenueData() {
  try {
    console.log("\n💰 Testing revenue data...");
    const response = await axios.get(
      `${BASE_URL}/analytics/revenue?period=month`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log("✅ Revenue data:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "❌ Revenue data failed:",
      error.response?.data || error.message
    );
  }
}

async function testLeadsBySource() {
  try {
    console.log("\n📈 Testing leads by source...");
    const response = await axios.get(`${BASE_URL}/analytics/leads-by-source`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log("✅ Leads by source:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      "❌ Leads by source failed:",
      error.response?.data || error.message
    );
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("ADMIN PANEL API TESTS");
  console.log("=".repeat(60));

  const loggedIn = await login();
  if (!loggedIn) {
    console.log("\n❌ Cannot proceed without login");
    return;
  }

  await testDashboardMetrics();
  await testClinicians();
  await testCentres();
  await testTopDoctors();
  await testRevenueData();
  await testLeadsBySource();

  console.log("\n" + "=".repeat(60));
  console.log("TESTS COMPLETE");
  console.log("=".repeat(60));
}

runTests();
