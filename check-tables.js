const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mibo-development-db',
  user: 'postgres',
  password: 'g20m340i',
});

async function checkTables() {
  const result = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  
  console.log('All tables:');
  result.rows.forEach(row => {
    console.log(`  - ${row.tablename}`);
  });
  
  await pool.end();
}

checkTables();
