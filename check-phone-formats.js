const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkPhoneFormats() {
  try {
    // Check recent users with phone numbers
    const query = `
      SELECT 
        id,
        full_name,
        phone,
        LENGTH(phone) as phone_length,
        CASE 
          WHEN phone LIKE '+91%' THEN 'Starts with +91'
          WHEN phone LIKE '91%' THEN 'Starts with 91'
          WHEN LENGTH(phone) = 10 THEN '10 digits only'
          ELSE 'Other format'
        END as phone_format
      FROM users
      WHERE phone IS NOT NULL
      ORDER BY id DESC
      LIMIT 20
    `;

    const result = await pool.query(query);

    console.log('\n=== Recent Users with Phone Numbers ===\n');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id} | Name: ${row.full_name}`);
      console.log(`Phone: ${row.phone} | Length: ${row.phone_length} | Format: ${row.phone_format}`);
      console.log('---');
    });

    // Summary of phone formats
    const summaryQuery = `
      SELECT 
        CASE 
          WHEN phone LIKE '+91%' THEN 'Starts with +91'
          WHEN phone LIKE '91%' THEN 'Starts with 91'
          WHEN LENGTH(phone) = 10 THEN '10 digits only'
          ELSE 'Other format'
        END as phone_format,
        COUNT(*) as count,
        MIN(phone) as example
      FROM users
      WHERE phone IS NOT NULL
      GROUP BY phone_format
      ORDER BY count DESC
    `;

    const summaryResult = await pool.query(summaryQuery);

    console.log('\n=== Phone Format Summary ===\n');
    summaryResult.rows.forEach(row => {
      console.log(`Format: ${row.phone_format}`);
      console.log(`Count: ${row.count}`);
      console.log(`Example: ${row.example}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPhoneFormats();
