// Script to check current database schema
import { db } from "../config/db";

async function checkSchema() {
  try {
    console.log("\n=== PATIENT_PROFILES TABLE ===");
    const patientColumns = await db.any(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'patient_profiles'
      ORDER BY ordinal_position
    `);
    console.table(patientColumns);

    console.log("\n=== APPOINTMENTS TABLE ===");
    const appointmentColumns = await db.any(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'appointments'
      ORDER BY ordinal_position
    `);
    console.table(appointmentColumns);

    console.log("\n=== PAYMENTS TABLE ===");
    const paymentColumns = await db.any(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments'
      ORDER BY ordinal_position
    `);
    console.table(paymentColumns);

    console.log("\n=== APPOINTMENT STATISTICS ===");
    const stats = await db.one(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(DISTINCT patient_id) as unique_patients
      FROM appointments
    `);
    console.log(stats);

    console.log("\n=== PAYMENT STATISTICS ===");
    const paymentStats = await db.any(`
      SELECT status, COUNT(*) as count
      FROM payments
      GROUP BY status
    `);
    console.table(paymentStats);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkSchema();
