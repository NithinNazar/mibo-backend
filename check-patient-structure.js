// Script to check patient user structure
const { Client } = require("pg");

async function checkPatientStructure() {
  const client = new Client({
    connectionString:
      "postgresql://postgres:g20m340i@localhost:5432/mibo-development-db",
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // 1. Check users table structure
    console.log("📋 USERS TABLE STRUCTURE:");
    console.log("=".repeat(80));
    const usersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.table(usersStructure.rows);

    // 2. Check patient_profiles table structure
    console.log("\n📋 PATIENT_PROFILES TABLE STRUCTURE:");
    console.log("=".repeat(80));
    const profilesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'patient_profiles'
      ORDER BY ordinal_position;
    `);
    console.table(profilesStructure.rows);

    // 3. Show sample patient data
    console.log("\n👤 SAMPLE PATIENT DATA (First 3 patients):");
    console.log("=".repeat(80));
    const samplePatients = await client.query(`
      SELECT 
        u.id as user_id,
        u.full_name,
        u.phone,
        u.email,
        u.user_type,
        u.is_active as user_active,
        pp.id as profile_id,
        pp.mrn,
        pp.date_of_birth,
        pp.gender,
        pp.registration_fee_paid,
        pp.is_active as profile_active,
        u.created_at
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      WHERE u.user_type = 'PATIENT'
      ORDER BY u.created_at DESC
      LIMIT 3;
    `);
    console.table(samplePatients.rows);

    // 4. Count total patients
    const count = await client.query(`
      SELECT COUNT(*) as total_patients
      FROM users
      WHERE user_type = 'PATIENT';
    `);
    console.log(`\n📊 Total Patients: ${count.rows[0].total_patients}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end();
  }
}

checkPatientStructure();
