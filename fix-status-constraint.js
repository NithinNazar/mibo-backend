// fix-status-constraint.js
const { db } = require("./dist/config/db");

async function fixStatusConstraint() {
  try {
    console.log("🔧 Fixing status check constraint...\n");

    // Check current constraint
    const constraint = await db.oneOrNone(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'appointments'::regclass
      AND conname LIKE '%status%'
    `);

    if (constraint) {
      console.log("📊 Current constraint:");
      console.log(`   Name: ${constraint.constraint_name}`);
      console.log(`   Definition: ${constraint.constraint_definition}\n`);

      console.log("🗑️  Dropping old constraint...\n");
      await db.none(`
        ALTER TABLE appointments 
        DROP CONSTRAINT ${constraint.constraint_name}
      `);
      console.log("✅ Old constraint dropped\n");
    }

    console.log("➕ Adding new constraint with CANCELLATION_REQUESTED...\n");
    
    await db.none(`
      ALTER TABLE appointments
      ADD CONSTRAINT appointments_status_check 
      CHECK (status IN (
        'PENDING',
        'CONFIRMED', 
        'CANCELLED',
        'COMPLETED',
        'NO_SHOW',
        'RESCHEDULED',
        'CANCELLATION_REQUESTED'
      ))
    `);

    console.log("✅ New constraint added successfully!\n");

    // Verify
    const newConstraint = await db.one(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'appointments'::regclass
      AND conname = 'appointments_status_check'
    `);

    console.log("📊 New constraint:");
    console.log(`   Name: ${newConstraint.constraint_name}`);
    console.log(`   Definition: ${newConstraint.constraint_definition}\n`);

    console.log("✅ Done! You can now use 'CANCELLATION_REQUESTED' status.\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

fixStatusConstraint();
