// test-cancellation.js
// Test appointment cancellation

const { db } = require("./dist/config/db");

async function testCancellation() {
  try {
    console.log("🔍 Checking database schema...\n");

    // Check if cancellation columns exist
    const columns = await db.any(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND column_name IN ('cancellation_reason', 'cancellation_requested_at', 'status')
      ORDER BY column_name
    `);

    console.log("📋 Appointments table columns:");
    console.table(columns);

    if (columns.length < 3) {
      console.log("\n⚠️  Missing columns! Adding them now...\n");

      await db.none(`
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
        ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS cancellation_approved_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS cancellation_approved_by INTEGER REFERENCES users(id)
      `);

      console.log("✅ Columns added successfully!\n");
    } else {
      console.log("\n✅ All required columns exist!\n");
    }

    // Get a sample appointment
    console.log("🔍 Checking for test appointments...\n");

    const appointments = await db.any(`
      SELECT 
        a.id,
        a.status,
        a.scheduled_start_at,
        a.patient_id,
        u.full_name as patient_name,
        u.phone as patient_phone
      FROM appointments a
      JOIN patient_profiles pp ON pp.id = a.patient_id
      JOIN users u ON u.id = pp.user_id
      WHERE a.status = 'CONFIRMED'
      ORDER BY a.scheduled_start_at DESC
      LIMIT 5
    `);

    if (appointments.length === 0) {
      console.log("❌ No confirmed appointments found for testing");
      process.exit(0);
    }

    console.log("📅 Sample confirmed appointments:");
    appointments.forEach((apt) => {
      console.log(`  - ID: ${apt.id}, Patient: ${apt.patient_name}, Date: ${apt.scheduled_start_at}, Status: ${apt.status}`);
    });

    console.log("\n✅ Database is ready for cancellation testing!");
    console.log("\n📝 To test cancellation:");
    console.log("   1. Make sure backend is running (npm run dev)");
    console.log("   2. Login to frontend with patient phone number");
    console.log("   3. Go to dashboard and click 'Cancel Appointment'");
    console.log("   4. Enter a reason (min 10 characters)");
    console.log("   5. Check if status changes to 'CANCELLATION_REQUESTED'");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testCancellation();
