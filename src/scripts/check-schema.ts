// Check database schema for patient_profiles table
import { db } from "../config/db";

async function checkSchema() {
  try {
    console.log("Checking patient_profiles table schema...\n");

    const columns = await db.any(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'patient_profiles'
            ORDER BY ordinal_position
        `);

    console.log("Columns in patient_profiles table:");
    console.table(columns);

    // Check specifically for date_of_birth
    const hasDateOfBirth = columns.some(
      (col) => col.column_name === "date_of_birth",
    );

    if (hasDateOfBirth) {
      console.log("\n✅ date_of_birth column EXISTS");
    } else {
      console.log("\n❌ date_of_birth column DOES NOT EXIST");
      console.log("\nYou need to run the migration:");
      console.log(
        "ALTER TABLE patient_profiles ADD COLUMN date_of_birth DATE NULL;",
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkSchema();
