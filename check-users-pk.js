const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mibo-development-db',
  user: 'postgres',
  password: 'g20m340i',
});

async function checkPK() {
  // Check primary key
  const pkResult = await pool.query(`
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'users'::regclass AND i.indisprimary
  `);
  
  console.log('Users table primary key:');
  pkResult.rows.forEach(row => {
    console.log(`  - ${row.attname}`);
  });
  
  // Check all columns including hidden ones
  const colResult = await pool.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  
  console.log('\nAll columns:');
  colResult.rows.forEach(row => {
    console.log(`  - ${row.column_name} (${row.data_type}) ${row.column_default || ''}`);
  });
  
  await pool.end();
}

checkPK();
