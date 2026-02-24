// Check if payment amounts match consultation fees
require("dotenv").config();
const { db } = require("./dist/config/db");

async function checkPaymentAmounts() {
  try {
    console.log("\n🔍 Checking Payment Amounts vs Consultation Fees\n");

    const results = await db.any(`
      SELECT 
        a.id as appointment_id,
        a.status as appointment_status,
        cp.consultation_fee,
        p.amount as payment_amount,
        p.status as payment_status,
        u.full_name as clinician_name
      FROM appointments a
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN payments p ON p.appointment_id = a.id
      WHERE a.is_active = TRUE
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    if (results.length === 0) {
      console.log("❌ No appointments found");
      return;
    }

    console.log(`Found ${results.length} appointments:\n`);

    results.forEach((row, index) => {
      console.log(`${index + 1}. Appointment ID: ${row.appointment_id}`);
      console.log(`   Clinician: ${row.clinician_name}`);
      console.log(`   Consultation Fee: ₹${row.consultation_fee}`);
      console.log(`   Payment Amount: ${row.payment_amount ? '₹' + row.payment_amount : 'No payment record'}`);
      console.log(`   Payment Status: ${row.payment_status || 'N/A'}`);
      
      if (row.payment_amount) {
        if (row.payment_amount === row.consultation_fee) {
          console.log(`   ✅ MATCH: Payment amount equals consultation fee`);
        } else {
          console.log(`   ❌ MISMATCH: Payment (₹${row.payment_amount}) != Fee (₹${row.consultation_fee})`);
        }
      }
      console.log();
    });

    await db.$pool.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkPaymentAmounts();
