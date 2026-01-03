// Quick test to verify database connection
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'g20m340i',
  database: 'mibo-development-db'
});

client.connect()
  .then(() => {
    console.log('✅ Database connection successful!');
    return client.query('SELECT NOW()');
  })
  .then(result => {
    console.log('✅ Query successful:', result.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('❌ Database connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('\nPossible issues:');
    console.error('1. PostgreSQL is not running');
    console.error('2. Password is incorrect');
    console.error('3. Database "mibo-development-db" does not exist');
    console.error('4. User "postgres" does not have access');
    client.end();
  });
