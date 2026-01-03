// fix-status-column.js
const { db } = require("./dist/config/db");

async function fixStatusColumn() {
  try {
    console.log("🔧 Fixing status column length...\n");

    // Check current column size
    const before = await db.one(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'status'
    `);

    console.log("📊 Current column info:");
    console.log(`   Type: ${before.data_type}`);
    console.log(`   Max Length: ${before.character_maximum_length}\n`);

    if (before.character_maximum_length < 50) {
      console.log("⚠️  Column too short! Updating to VARCHAR(50)...\n");

      await db.none(`
        ALTER TABLE appointments 
        ALTER COLUMN status TYPE VARCHAR(50)
      `);

      console.log("✅ Status column updated successfully!\n");
    } else {
      console.log("✅ Column already has sufficient length\n");
    }

    // Verify the change
    const after = await db.one(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'status'
    `);

    console.log("📊 Updated column info:");
    console.log(`   Type: ${after.data_type}`);
    console.log(`   Max Length: ${after.character_maximum_length}\n`);

    console.log("✅ Done! You can now cancel appointments.");
    console.log("   'CANCELLATION_REQUESTED' (24 chars) will fit in VARCHAR(50)\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

fixStatusColumn();
