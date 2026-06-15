// Quick script to check if date_of_birth column exists
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:g20m340i@localhost:5432/mibo-development-db'
});

async function checkColumn() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'patient_profiles'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== patient_profiles table columns ===');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    const hasDOB = result.rows.some(row => row.column_name === 'date_of_birth');
    console.log(`\n✅ date_of_birth column exists: ${hasDOB}`);
    
    if (!hasDOB) {
      console.log('\n❌ date_of_birth column is MISSING! Run migration:');
      console.log('ALTER TABLE patient_profiles ADD COLUMN date_of_birth DATE NULL;');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumn();
