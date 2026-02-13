const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mibo-development-db',
  user: 'postgres',
  password: 'g20m340i',
});

async function checkColumns() {
  const result = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'clinician_profiles'
    ORDER BY ordinal_position
  `);
  
  console.log('Clinician Profiles Columns:');
  result.rows.forEach(row => {
    console.log(`  - ${row.column_name} (${row.data_type})`);
  });
  
  await pool.end();
}

checkColumns();
