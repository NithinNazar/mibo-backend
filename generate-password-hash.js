// Generate bcrypt hash for password
const bcrypt = require('bcryptjs');

const password = 'test@789';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n📋 Password Hash Generated:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Copy this hash and use it in the SQL INSERT statement');
});
