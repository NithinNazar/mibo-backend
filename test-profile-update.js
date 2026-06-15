// Test profile update endpoint
const axios = require("axios");

async function testProfileUpdate() {
  try {
    // First, we need to get a valid token by logging in
    // For now, let's just test if the endpoint structure is correct

    const testData = {
      firstName: "Nithin",
      lastName: "Nazar",
      email: "nithin@gmail.com",
      dateOfBirth: "1994-03-18",
      age: 32,
      gender: "MALE",
    };

    console.log("Test data:", JSON.stringify(testData, null, 2));
    console.log("\nThis is the data structure the frontend is sending.");
    console.log("The backend should accept this format.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testProfileUpdate();
