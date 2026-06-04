// Run migration to add patient registration fields
import { db } from "./src/config/db";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  try {
    console.log("🔄 Running migration: add_patient_registration_fields.sql");

    const migrationPath = path.join(
      __dirname,
      "migrations",
      "add_patient_registration_fields.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    // Execute migration
    await db.none(sql);

    console.log("✅ Migration completed successfully");

    // Verify the changes
    const userColumns = await db.any(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('first_name', 'last_name')
      ORDER BY column_name
    `);

    console.log("\n📋 Users table columns added:");
    userColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const profileColumns = await db.any(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'patient_profiles' 
      AND column_name = 'age'
    `);

    console.log("\n📋 Patient_profiles table columns added:");
    profileColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
