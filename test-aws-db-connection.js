/**
 * Test AWS RDS PostgreSQL Connection
 * Run: node test-aws-db-connection.js
 */

const pgPromise = require('pg-promise');

// AWS RDS Connection String (URL-encoded password)
// SSL is configured separately below
const AWS_DATABASE_URL = 'postgresql://mibo_admin:mibo%23aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb';

// SSL configuration for AWS RDS
const sslConfig = {
  ssl: {
    rejectUnauthorized: false // AWS RDS uses self-signed certificates
  }
};

console.log('\n========================================');
console.log('  Testing AWS RDS Connection');
console.log('========================================\n');

console.log('Host: mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com');
console.log('Database: mibodb');
console.log('User: mibo_admin');
console.log('SSL: Required');
console.log('\nConnecting...\n');

const pgp = pgPromise();
const db = pgp({
  connectionString: AWS_DATABASE_URL,
  ...sslConfig
});

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic Connection');
    const result = await db.one('SELECT version() as version, current_database() as database, current_user as user');
    console.log('✅ Connection successful!');
    console.log(`   PostgreSQL Version: ${result.version.split(',')[0]}`);
    console.log(`   Database: ${result.database}`);
    console.log(`   User: ${result.user}`);
    console.log('');

    // Test 2: Check tables
    console.log('Test 2: Checking Tables');
    const tables = await db.any(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found in database');
      console.log('   You may need to run migrations or import schema');
    } else {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }
    console.log('');

    // Test 3: Check specific tables
    console.log('Test 3: Checking Key Tables');
    const keyTables = ['users', 'patients', 'appointments', 'centres', 'staff'];
    
    for (const tableName of keyTables) {
      try {
        const count = await db.one(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${count.count} records`);
      } catch (err) {
        console.log(`❌ ${tableName}: Table not found or error`);
      }
    }
    console.log('');

    // Test 4: Connection Info
    console.log('Test 4: Connection Info');
    const connInfo = await db.one(`
      SELECT 
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        current_setting('ssl') as ssl_enabled
    `);
    console.log(`✅ Server: ${connInfo.server_ip}:${connInfo.server_port}`);
    console.log(`✅ SSL: ${connInfo.ssl_enabled === 'on' ? 'Enabled' : 'Disabled'}`);
    console.log('');

    console.log('========================================');
    console.log('  ✅ All Tests Passed!');
    console.log('========================================');
    console.log('\nYour backend can communicate with AWS RDS.');
    console.log('You can now switch to AWS configuration:\n');
    console.log('  Run: switch-to-aws.bat');
    console.log('  Then: npm run dev\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('  ❌ Connection Failed');
    console.error('========================================\n');
    
    if (error.code === 'ENOTFOUND') {
      console.error('Error: Cannot resolve hostname');
      console.error('Possible causes:');
      console.error('  - RDS endpoint is incorrect');
      console.error('  - DNS resolution issue');
      console.error('  - Internet connection problem\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Error: Connection refused');
      console.error('Possible causes:');
      console.error('  - RDS security group does not allow your IP');
      console.error('  - RDS is not publicly accessible');
      console.error('  - Port 5432 is blocked by firewall\n');
    } else if (error.code === '28P01') {
      console.error('Error: Authentication failed');
      console.error('Possible causes:');
      console.error('  - Incorrect username or password');
      console.error('  - User does not have access to database\n');
    } else if (error.code === '3D000') {
      console.error('Error: Database does not exist');
      console.error('Possible causes:');
      console.error('  - Database name "mibodb" is incorrect');
      console.error('  - Database has not been created\n');
    } else if (error.message && error.message.includes('SSL')) {
      console.error('Error: SSL connection issue');
      console.error('Possible causes:');
      console.error('  - SSL mode not properly configured');
      console.error('  - RDS requires SSL but connection string missing sslmode=require\n');
    } else {
      console.error('Error:', error.message);
      console.error('\nFull error:', error);
    }

    console.error('\nTroubleshooting steps:');
    console.error('1. Check RDS security group allows your IP');
    console.error('2. Verify RDS is "Publicly accessible"');
    console.error('3. Confirm credentials in AWS RDS console');
    console.error('4. Check database name is "mibodb"');
    console.error('5. Ensure SSL is enabled (sslmode=require)\n');
    
    process.exit(1);
  } finally {
    await pgp.end();
  }
}

testConnection();
