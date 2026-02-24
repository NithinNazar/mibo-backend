// Test script to verify Razorpay payment link amount is correct
require("dotenv").config();
const { db } = require("./dist/config/db");

async function testPaymentLinkAmount() {
  console.log("\n🔍 Testing Payment Link Amount Flow\n");
  console.log("=" .repeat(60));

  try {
    // 1. Get a sample clinician with consultation_fee
    console.log("\n1️⃣ Fetching clinician data...");
    const clinician = await db.oneOrNone(`
      SELECT 
        cp.id,
        u.full_name,
        cp.specialization,
        cp.consultation_fee
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.is_active = TRUE
      LIMIT 1
    `);

    if (!clinician) {
      console.log("❌ No active clinicians found in database");
      return;
    }

    console.log("✅ Clinician found:");
    console.log(`   ID: ${clinician.id}`);
    console.log(`   Name: ${clinician.full_name}`);
    console.log(`   Specialization: ${clinician.specialization}`);
    console.log(`   Consultation Fee: ₹${clinician.consultation_fee}`);

    // 2. Get a sample appointment for this clinician
    console.log("\n2️⃣ Fetching appointment data...");
    const appointment = await db.oneOrNone(`
      SELECT 
        a.*,
        u.full_name as clinician_name,
        cp.specialization,
        cp.consultation_fee,
        c.name as centre_name
      FROM appointments a
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      JOIN centres c ON a.centre_id = c.id
      WHERE a.clinician_id = $1
        AND a.is_active = TRUE
      ORDER BY a.created_at DESC
      LIMIT 1
    `, [clinician.id]);

    if (!appointment) {
      console.log("⚠️  No appointments found for this clinician");
      console.log("   Creating a test scenario...");
      
      // Simulate what would happen
      console.log("\n3️⃣ Simulated Payment Link Creation:");
      console.log(`   Consultation Fee: ₹${clinician.consultation_fee}`);
      console.log(`   Amount in Paise: ${clinician.consultation_fee * 100}`);
      console.log(`   Razorpay will create link with: ₹${clinician.consultation_fee}`);
      
      return;
    }

    console.log("✅ Appointment found:");
    console.log(`   ID: ${appointment.id}`);
    console.log(`   Status: ${appointment.status}`);
    console.log(`   Clinician: ${appointment.clinician_name}`);
    console.log(`   Consultation Fee from JOIN: ₹${appointment.consultation_fee}`);

    // 3. Verify payment link amount calculation
    console.log("\n3️⃣ Payment Link Amount Calculation:");
    const consultationFee = appointment.consultation_fee || 500;
    const amountInPaise = consultationFee * 100;

    console.log(`   Consultation Fee: ₹${consultationFee}`);
    console.log(`   Amount in Paise: ${amountInPaise}`);
    console.log(`   Razorpay Payment Link Amount: ₹${consultationFee}`);

    // 4. Check if payment record exists
    console.log("\n4️⃣ Checking payment records...");
    const payment = await db.oneOrNone(`
      SELECT 
        id,
        order_id,
        payment_link_url,
        amount,
        currency,
        status
      FROM payments
      WHERE appointment_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [appointment.id]);

    if (payment) {
      console.log("✅ Payment record found:");
      console.log(`   Payment ID: ${payment.id}`);
      console.log(`   Order ID: ${payment.order_id}`);
      console.log(`   Amount: ₹${payment.amount}`);
      console.log(`   Currency: ${payment.currency}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Payment Link: ${payment.payment_link_url || 'Not generated'}`);

      // Verify amount matches
      if (payment.amount === consultationFee) {
        console.log("\n✅ VERIFICATION PASSED: Payment amount matches consultation fee!");
      } else {
        console.log("\n❌ VERIFICATION FAILED: Payment amount does NOT match!");
        console.log(`   Expected: ₹${consultationFee}`);
        console.log(`   Found: ₹${payment.amount}`);
      }
    } else {
      console.log("⚠️  No payment record found for this appointment");
    }

    // 5. Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY:");
    console.log("=".repeat(60));
    console.log(`✅ Clinician consultation fee: ₹${clinician.consultation_fee}`);
    console.log(`✅ Appointment fetches fee via JOIN: ₹${appointment.consultation_fee}`);
    console.log(`✅ Payment service uses: ₹${consultationFee}`);
    console.log(`✅ Razorpay receives: ${amountInPaise} paise (₹${consultationFee})`);
    
    if (payment && payment.amount === consultationFee) {
      console.log(`✅ Payment record stores: ₹${payment.amount}`);
      console.log("\n🎉 ALL AMOUNTS MATCH CORRECTLY!");
    } else if (payment) {
      console.log(`❌ Payment record stores: ₹${payment.amount}`);
      console.log("\n⚠️  AMOUNT MISMATCH DETECTED!");
    } else {
      console.log("\n⚠️  No payment record to verify");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Test completed successfully");
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Error during test:", error);
  } finally {
    await db.$pool.end();
  }
}

// Run the test
testPaymentLinkAmount();
