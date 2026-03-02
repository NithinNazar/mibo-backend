require('dotenv').config();
const pgp = require('pg-promise')();
const db = pgp(process.env.DATABASE_URL);

async function checkPaymentsSchema() {
  try {
    console.log('\n📋 Checking payments table schema...\n');
    
    // Get column information
    const columns = await db.any(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'payments'
      ORDER BY ordinal_position
    `);
    
    console.log('Current payments table columns:');
    console.log('================================\n');
    
    columns.forEach(col => {
      console.log(`${col.column_name}`);
      console.log(`  Type: ${col.data_type}`);
      console.log(`  Nullable: ${col.is_nullable}`);
      console.log(`  Default: ${col.column_default || 'none'}`);
      console.log('');
    });
    
    // Check for missing columns
    const columnNames = columns.map(c => c.column_name);
    const requiredColumns = ['payment_link_id', 'payment_link_url', 'payment_link_sent_at'];
    
    console.log('\n🔍 Checking for required payment link columns...\n');
    
    requiredColumns.forEach(col => {
      if (columnNames.includes(col)) {
        console.log(`✅ ${col} - EXISTS`);
      } else {
        console.log(`❌ ${col} - MISSING`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pgp.end();
  }
}

checkPaymentsSchema();
