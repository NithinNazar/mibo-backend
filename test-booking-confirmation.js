// test-booking-confirmation.js
// Test script for booking confirmation WhatsApp template

const axios = require("axios");
require("dotenv").config();

const GALLABOX_API_KEY = process.env.GALLABOX_API_KEY;
const GALLABOX_API_SECRET = process.env.GALLABOX_API_SECRET;
const GALLABOX_CHANNEL_ID = process.env.GALLABOX_CHANNEL_ID;

// Test phone number (your WhatsApp number)
const TEST_PHONE = "919048810697"; // Replace with your number

async function testBookingConfirmation() {
  console.log("🧪 Testing Booking Confirmation Template...\n");

  // Sample booking data
  const bookingData = {
    patientName: "Nithin",
    clinicianName: "Prajwal Devurkar",
    centreName: "Bangalore",
    appointmentDate: "January 10, 2026",
    appointmentTime: "11:30 AM",
    teamName: "Mibo Care",
  };

  console.log("📋 Booking Details:");
  console.log(`   Patient: ${bookingData.patientName}`);
  console.log(`   Clinician: Dr. ${bookingData.clinicianName}`);
  console.log(`   Centre: ${bookingData.centreName}`);
  console.log(`   Date: ${bookingData.appointmentDate}`);
  console.log(`   Time: ${bookingData.appointmentTime}`);
  console.log(`   Phone: +${TEST_PHONE}\n`);

  const payload = {
    channelId: GALLABOX_CHANNEL_ID,
    channelType: "whatsapp",
    recipient: {
      name: bookingData.patientName,
      phone: TEST_PHONE,
    },
    whatsapp: {
      type: "template",
      template: {
        templateName: "booking_conformation",
        bodyValues: {
          "1": bookingData.patientName,
          "2": bookingData.clinicianName,
          "3": bookingData.centreName,
          "4": bookingData.appointmentDate,
          "5": bookingData.appointmentTime,
          "6": bookingData.teamName,
        },
      },
    },
  };

  console.log("📤 Sending template message...\n");
  console.log("Payload:", JSON.stringify(payload, null, 2), "\n");

  try {
    const response = await axios.post(
      "https://server.gallabox.com/devapi/messages/whatsapp",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          apiKey: GALLABOX_API_KEY,
          apiSecret: GALLABOX_API_SECRET,
        },
      }
    );

    console.log("✅ SUCCESS! Booking confirmation sent via WhatsApp");
    console.log("\n📱 Response:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("\n✓ Check your WhatsApp for the confirmation message!");
  } catch (error) {
    console.error("❌ ERROR sending booking confirmation:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testBookingConfirmation();
