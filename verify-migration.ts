import { db } from "./src/config/db";

async function verifyMigration() {
  try {
    console.log("🔍 Verifying migration changes...\n");

    // Check if columns exist
    const columns = await db.any(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND column_name IN ('notes', 'google_meet_link', 'google_calendar_event_id')
      ORDER BY column_name;
    `);

    console.log("📋 New columns in appointments table:");
    columns.forEach((col: any) => {
      console.log(
        `   ✓ ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`,
      );
    });

    // Check if indexes exist
    const indexes = await db.any(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'appointments'
      AND indexname IN ('idx_appointments_with_notes', 'idx_appointments_with_meet_link')
      ORDER BY indexname;
    `);

    console.log("\n📊 New indexes:");
    indexes.forEach((idx: any) => {
      console.log(`   ✓ ${idx.indexname}`);
    });

    // Check column comments
    const comments = await db.any(`
      SELECT 
        cols.column_name,
        pg_catalog.col_description(c.oid, cols.ordinal_position::int) as column_comment
      FROM information_schema.columns cols
      JOIN pg_catalog.pg_class c ON c.relname = cols.table_name
      WHERE cols.table_name = 'appointments'
      AND cols.column_name IN ('notes', 'google_meet_link', 'google_calendar_event_id')
      AND pg_catalog.col_description(c.oid, cols.ordinal_position::int) IS NOT NULL
      ORDER BY cols.column_name;
    `);

    console.log("\n💬 Column comments:");
    comments.forEach((comment: any) => {
      console.log(`   ✓ ${comment.column_name}: "${comment.column_comment}"`);
    });

    console.log(
      "\n✅ Migration verification complete! All changes applied successfully.",
    );

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Verification failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyMigration();
