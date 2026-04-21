import { db } from "./src/config/db";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  try {
    console.log(
      "🔄 Running migration: 005_add_notes_and_google_meet_to_appointments.sql",
    );

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "005_add_notes_and_google_meet_to_appointments.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await db.none(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("   - Added 'notes' column to appointments table");
    console.log("   - Added 'google_meet_link' column to appointments table");
    console.log(
      "   - Added 'google_calendar_event_id' column to appointments table",
    );
    console.log("   - Created indexes for performance optimization");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
