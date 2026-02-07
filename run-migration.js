const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import pg-promise
const pgp = require('pg-promise')();

async function runMigration() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file>');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, 'migrations', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  const db = pgp(process.env.DATABASE_URL);
  
  try {
    console.log(`Running migration: ${migrationFile}`);
    console.log('='.repeat(60));
    
    await db.multi(sql);
    
    console.log('='.repeat(60));
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.query) {
      console.error('\nFailed query:');
      console.error(error.query);
    }
    process.exit(1);
  } finally {
    pgp.end();
  }
}

runMigration();
