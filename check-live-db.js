const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== CHECKING DATABASE ===\n');
    
    // Check centres
    console.log('1. CENTRES:');
    const centres = await client.query('SELECT id, name, city FROM centres ORDER BY id');
    if (centres.rows.length === 0) {
      console.log('   ❌ NO CENTRES FOUND - This is likely the issue!');
    } else {
      console.log(`   ✓ Found ${centres.rows.length} centres:`);
      centres.rows.forEach(c => console.log(`     - ID: ${c.id}, Name: ${c.name}, City: ${c.city}`));
    }
    
    // Check roles
    console.log('\n2. ROLES:');
    const roles = await client.query('SELECT id, name FROM roles ORDER BY id');
    if (roles.rows.length === 0) {
      console.log('   ❌ NO ROLES FOUND');
    } else {
      console.log(`   ✓ Found ${roles.rows.length} roles:`);
      roles.rows.forEach(r => console.log(`     - ID: ${r.id}, Name: ${r.name}`));
    }
    
    // Check clinician role specifically
    const clinicianRole = await client.query("SELECT id FROM roles WHERE name = 'CLINICIAN'");
    if (clinicianRole.rows.length === 0) {
      console.log('   ❌ CLINICIAN role not found!');
    } else {
      console.log(`   ✓ CLINICIAN role exists with ID: ${clinicianRole.rows[0].id}`);
    }
    
    // Check foreign keys on clinician_profiles
    console.log('\n3. FOREIGN KEYS ON clinician_profiles:');
    const fks = await client.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'clinician_profiles' 
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    fks.rows.forEach(fk => {
      console.log(`   - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check foreign keys on centre_staff_assignments
    console.log('\n4. FOREIGN KEYS ON centre_staff_assignments:');
    const fks2 = await client.query(`
      SELECT 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'centre_staff_assignments' 
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    fks2.rows.forEach(fk => {
      console.log(`   - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check existing clinicians
    console.log('\n5. EXISTING CLINICIANS:');
    const clinicians = await client.query('SELECT COUNT(*) as count FROM clinician_profiles');
    console.log(`   Found ${clinicians.rows[0].count} clinicians`);
    
    // Check existing users
    console.log('\n6. USERS:');
    const users = await client.query("SELECT COUNT(*) as count FROM users WHERE user_type = 'CLINICIAN'");
    console.log(`   Found ${users.rows[0].count} users with type CLINICIAN`);
    
    console.log('\n=== DIAGNOSIS ===');
    if (centres.rows.length === 0) {
      console.log('❌ PROBLEM FOUND: No centres exist in the database!');
      console.log('   SOLUTION: You need to create centres first before creating clinicians.');
      console.log('   Go to the admin panel and create centres (Bangalore, Kochi, etc.)');
    } else {
      console.log('✓ Centres exist. The issue might be:');
      console.log('  - Wrong centre_id being sent from frontend');
      console.log('  - Missing role_id');
      console.log('  - Other foreign key constraint issue');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
