const { db } = require('./dist/config/db');

(async () => {
  try {
    const result = await db.any(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== user_roles table columns ===');
    console.table(result);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
