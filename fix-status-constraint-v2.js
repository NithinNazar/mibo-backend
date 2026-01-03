// fix-status-constraint-v2.js
const { db } = require("./dist/config/db");

async function fixStatusConstraint() {
  try {
    console.log("🔧 Fixing status check constraint...\n");

    // Check what status values exist
    console.log("📊 Checking existing status values...\n");
    const statuses = await db.any(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM appointments
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log("Current status values in database:");
    statuses.forEach(s => {
      console.log(`   ${s.status}: ${s.count} appointments`);
    });
    console.log();

    // Drop old constraint
    console.log("🗑️  Dropping old constraint...\n");
    await db.none(`
      ALTER TABLE appointments 
      DROP CONSTRAINT IF EXISTS appointments_status_check
    `);
    console.log("✅ Old constraint dropped\n");

    // Create list of all statuses (existing + new)
    const allStatuses = [...new Set([
      ...statuses.map(s => s.status),
      'PENDING',
      'CONFIRMED',
      'CANCELLED',
      'COMPLETED',
      'NO_SHOW',
      'RESCHEDULED',
      'CANCELLATION_REQUESTED'
    ])];

    console.log("➕ Adding new constraint with all statuses:\n");
    allStatuses.forEach(s => console.log(`   - ${s}`));
    console.log();

    const statusList = allStatuses.map(s => `'${s}'`).join(', ');
    
    await db.none(`
      ALTER TABLE appointments
      ADD CONSTRAINT appointments_status_check 
      CHECK (status IN (${statusList}))
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
    console.log(`   ${newConstraint.constraint_definition}\n`);

    console.log("✅ Done! You can now use 'CANCELLATION_REQUESTED' status.\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

fixStatusConstraint();
