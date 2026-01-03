const { db } = require('./dist/config/db');

async function checkPhone() {
  const admin = await db.one('SELECT id, username, phone FROM users WHERE username = $1', ['admin']);
  console.log('Admin phone in database:', admin.phone);
  console.log('Phone length:', admin.phone.length);
  
  if (admin.phone.startsWith('91')) {
    console.log('\n⚠️  Phone has country code. Updating to 10 digits...');
    const cleanPhone = admin.phone.replace(/^91/, '');
    await db.none('UPDATE users SET phone = $1 WHERE id = $2', [cleanPhone, admin.id]);
    console.log('✓ Updated to:', cleanPhone);
  } else {
    console.log('✓ Phone is already in correct format');
  }
  
  process.exit(0);
}

checkPhone();
