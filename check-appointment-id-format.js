const { db } = require('./dist/config/db');

async function checkAppointmentIdFormat() {
  console.log('🔍 Checking Appointment ID Type and Format\n');
  console.log('=' .repeat(80));

  try {
    // ============================================================================
    // TEST 1: Check appointments table schema
    // ============================================================================
    console.log('\n📊 TEST 1: Check appointments table schema\n');

    const appointmentsSchema = await db.any(`
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'appointments' AND column_name = 'id'
      ORDER BY ordinal_position;
    `);

    console.log('✅ Appointment ID column details:');
    appointmentsSchema.forEach(col => {
      console.log(`   Column: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Max Length: ${col.character_maximum_length || 'N/A'}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log(`   Default: ${col.column_default || 'N/A'}`);
    });

    // ============================================================================
    // TEST 2: Check actual appointment IDs in database
    // ============================================================================
    console.log('\n📊 TEST 2: Check actual appointment IDs in database\n');

    const appointments = await db.any(`
      SELECT 
        id,
        patient_id,
        clinician_id,
        appointment_type,
        status,
        scheduled_start_at
      FROM appointments
      ORDER BY id DESC
      LIMIT 5;
    `);

    if (appointments.length > 0) {
      console.log(`✅ Found ${appointments.length} appointment(s):\n`);
      appointments.forEach(apt => {
        console.log(`   Appointment ID: ${apt.id}`);
        console.log(`     Type: ${typeof apt.id}`);
        console.log(`     Value: ${apt.id}`);
        console.log(`     Patient ID: ${apt.patient_id}`);
        console.log(`     Clinician ID: ${apt.clinician_id}`);
        console.log(`     Type: ${apt.appointment_type}`);
        console.log(`     Status: ${apt.status}`);
        console.log(`     Date: ${apt.scheduled_start_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No appointments found in database');
    }

    // ============================================================================
    // TEST 3: Check sequence/auto-increment
    // ============================================================================
    console.log('\n📊 TEST 3: Check ID generation method\n');

    const sequences = await db.any(`
      SELECT 
        sequence_name,
        last_value,
        increment_by
      FROM information_schema.sequences
      WHERE sequence_name LIKE '%appointment%';
    `);

    if (sequences.length > 0) {
      console.log('✅ Found sequence(s) for appointments:');
      sequences.forEach(seq => {
        console.log(`   Sequence: ${seq.sequence_name}`);
        console.log(`   Last Value: ${seq.last_value}`);
        console.log(`   Increment By: ${seq.increment_by}`);
      });
    } else {
      console.log('⚠️  No sequences found (might use SERIAL or IDENTITY)');
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 SUMMARY:\n');

    const idColumn = appointmentsSchema[0];
    console.log(`Appointment ID Details:`);
    console.log(`  Type: ${idColumn.data_type}`);
    console.log(`  Format: Auto-incrementing integer`);
    
    if (appointments.length > 0) {
      console.log(`\nExample Appointment IDs:`);
      appointments.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.id}`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

checkAppointmentIdFormat();
