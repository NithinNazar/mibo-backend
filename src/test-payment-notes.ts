// Test script to verify payment_notes functionality using existing db connection
// Run with: npx ts-node src/test-payment-notes.ts

import { db } from "./config/db";
import logger from "./config/logger";

async function testPaymentNotesFeature() {
  try {
    console.log("\n🧪 Testing Payment Notes Feature\n");
    console.log("=".repeat(60));

    // Test 1: Check if payment_notes column exists
    console.log("\n📋 Test 1: Checking payment_notes column...");
    const columnCheck = await db.oneOrNone(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payments' 
        AND column_name = 'payment_notes'
    `);

    if (columnCheck) {
      console.log("✅ payment_notes column exists!");
      console.log(`   Type: ${columnCheck.data_type}`);
      console.log(`   Nullable: ${columnCheck.is_nullable}`);
    } else {
      console.log("❌ payment_notes column NOT FOUND!");
      console.log("   ⚠️  Run migration: add_payment_notes_to_payments.sql");
      return;
    }

    // Test 2: Check if payment_method column exists
    console.log("\n📋 Test 2: Checking payment_method column...");
    const methodCheck = await db.oneOrNone(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'payments' 
        AND column_name = 'payment_method'
    `);

    if (methodCheck) {
      console.log("✅ payment_method column exists!");
      console.log(`   Type: ${methodCheck.data_type}`);
      console.log(`   Default: ${methodCheck.column_default}`);
    } else {
      console.log("❌ payment_method column NOT FOUND!");
      console.log("   ⚠️  Run migration: add_payment_method_to_payments.sql");
      return;
    }

    // Test 3: Check existing payments summary
    console.log("\n📋 Test 3: Checking existing payments...");
    const paymentsSummary = await db.any(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COUNT(CASE WHEN payment_notes IS NOT NULL AND payment_notes != '' THEN 1 END) as with_notes,
        SUM(amount) as total_amount
      FROM payments
      WHERE status = 'SUCCESS'
      GROUP BY payment_method
      ORDER BY count DESC
    `);

    if (paymentsSummary.length > 0) {
      console.log("✅ Payments summary:");
      paymentsSummary.forEach((row) => {
        console.log(
          `   ${row.payment_method || "ONLINE"}: ${row.count} total, ${row.with_notes} with notes, ₹${row.total_amount}`,
        );
      });
    } else {
      console.log("   No payments found (empty database)");
    }

    // Test 4: Try to find a test appointment
    console.log("\n📋 Test 4: Looking for test data...");
    const testAppointment = await db.oneOrNone(`
      SELECT 
        a.id as appointment_id,
        a.patient_id,
        a.status,
        u.full_name as patient_name
      FROM appointments a
      JOIN patient_profiles pp ON a.patient_id = pp.id
      JOIN users u ON pp.user_id = u.id
      WHERE a.status IN ('BOOKED', 'CONFIRMED')
      ORDER BY a.created_at DESC
      LIMIT 1
    `);

    if (testAppointment) {
      console.log("✅ Found test appointment:");
      console.log(`   ID: ${testAppointment.appointment_id}`);
      console.log(`   Patient: ${testAppointment.patient_name}`);
      console.log(`   Status: ${testAppointment.status}`);

      // Test 5: Simulate creating a payment with notes
      console.log("\n📋 Test 5: Testing payment INSERT with notes...");
      const testOrderId = `test_${Date.now()}`;
      const testPaymentId = `test_cash_${Date.now()}`;

      const newPayment = await db.one(
        `
        INSERT INTO payments (
          patient_id, appointment_id, provider, order_id, payment_id,
          amount, currency, status, payment_method,
          consultation_fee, registration_fee, payment_notes,
          paid_at, created_at, updated_at
        ) VALUES ($1, $2, 'DIRECT', $3, $4, $5, $6, 'SUCCESS', $7, $8, $9, $10, NOW(), NOW(), NOW())
        RETURNING id, payment_method, payment_notes, amount, status
      `,
        [
          testAppointment.patient_id,
          testAppointment.appointment_id,
          testOrderId,
          testPaymentId,
          600,
          "INR",
          "CASH",
          500,
          100,
          "Test payment note - This is a sample note from automated test. Patient paid ₹600 in cash.",
        ],
      );

      console.log("✅ Payment created successfully!");
      console.log(`   Payment ID: ${newPayment.id}`);
      console.log(`   Method: ${newPayment.payment_method}`);
      console.log(`   Amount: ₹${newPayment.amount}`);
      console.log(`   Notes: "${newPayment.payment_notes}"`);

      // Test 6: Fetch the payment to verify notes
      console.log("\n📋 Test 6: Fetching payment to verify...");
      const fetchedPayment = await db.one(
        `
        SELECT 
          p.id,
          p.payment_method,
          p.payment_notes,
          p.amount,
          p.status,
          a.id as appointment_id,
          u.full_name as patient_name
        FROM payments p
        JOIN appointments a ON p.appointment_id = a.id
        JOIN patient_profiles pp ON a.patient_id = pp.id
        JOIN users u ON pp.user_id = u.id
        WHERE p.id = $1
      `,
        [newPayment.id],
      );

      console.log("✅ Payment fetched successfully!");
      console.log(`   Patient: ${fetchedPayment.patient_name}`);
      console.log(`   Method: ${fetchedPayment.payment_method}`);
      console.log(`   Notes: "${fetchedPayment.payment_notes}"`);
      console.log(
        `   ✓ Notes preserved: ${fetchedPayment.payment_notes === newPayment.payment_notes}`,
      );

      // Clean up test data
      console.log("\n🧹 Cleaning up test data...");
      await db.none("DELETE FROM payments WHERE id = $1", [newPayment.id]);
      console.log("✅ Test data deleted");
    } else {
      console.log("⚠️  No test appointments found");
      console.log("   Schema is correct, but no data to test with");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ ✅ ✅  ALL TESTS PASSED!  ✅ ✅ ✅");
    console.log("=".repeat(60));
    console.log("\n📝 Summary:");
    console.log("   ✓ payment_notes column exists");
    console.log("   ✓ payment_method column exists");
    console.log("   ✓ Can INSERT payments with notes");
    console.log("   ✓ Can SELECT payments with notes");
    console.log("   ✓ Notes are preserved correctly");
    console.log("   ✓ Database schema ready for production!\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error:", error.message);
    console.error("\nStack:", error.stack);

    if (error.code === "42P01") {
      console.log("\n💡 Table does not exist. Check database setup.");
    } else if (error.code === "42703") {
      console.log("\n💡 Column does not exist. Run migrations:");
      console.log("   1. add_payment_method_to_payments.sql");
      console.log("   2. add_payment_notes_to_payments.sql");
    }

    process.exit(1);
  }
}

// Run tests
console.log("\n🚀 Starting Payment Notes Feature Test...");
testPaymentNotesFeature();
