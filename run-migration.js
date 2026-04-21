const { db } = require('./dist/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running migration: 006_add_default_consultation_duration.sql');
    
    const migrationPath = path.join(__dirname, 'migrations', '006_add_default_consultation_duration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await db.none(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();