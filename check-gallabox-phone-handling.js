const { db } = require('./dist/config/db');

async function checkGallaboxPhoneHandling() {
  console.log('📱 Checking How Gallabox Receives Phone Numbers\n');
  console.log('=' .repeat(80));

  try {
    // ============================================================================
    // TEST 1: Check actual phone numbers that received WhatsApp
    // ============================================================================
    console.log('\n📊 TEST 1: Check phone numbers in database\n');

    const users = await db.any(`
      SELECT id, full_name, phone, LENGTH(phone) as phone_length
      FROM users
      WHERE phone IS NOT NULL
      ORDER BY id DESC
      LIMIT 10;
    `);

    console.log('✅ Phone numbers in database:\n');
    users.forEach(user => {
      const startsWithCountryCode = user.phone && (user.phone.startsWith('91') || user.phone.startsWith('+91'));
      console.log(`   ${user.full_name}:`);
      console.log(`     Phone: ${user.phone}`);
      console.log(`     Length: ${user.phone_length} digits`);
      console.log(`     Has country code: ${startsWithCountryCode ? 'YES (91)' : 'NO'}`);
      console.log('');
    });

    // ============================================================================
    // TEST 2: Check notification logs to see what was sent to Gallabox
    // ============================================================================
    console.log('\n📊 TEST 2: Check notification logs (what was sent to Gallabox)\n');

    const notifications = await db.any(`
      SELECT 
        n.id,
        n.phone,
        n.channel,
        n.status,
        n.payload_data,
        n.created_at,
        u.full_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.channel = 'WHATSAPP'
      ORDER BY n.created_at DESC
      LIMIT 5;
    `);

    if (notifications.length > 0) {
      console.log(`✅ Found ${notifications.length} WhatsApp notification(s):\n`);
      notifications.forEach(notif => {
        console.log(`   Notification ID: ${notif.id}`);
        console.log(`     User: ${notif.full_name || 'Unknown'}`);
        console.log(`     Phone sent to Gallabox: ${notif.phone}`);
        console.log(`     Phone length: ${notif.phone ? notif.phone.length : 0} characters`);
        console.log(`     Status: ${notif.status}`);
        console.log(`     Date: ${notif.created_at}`);
        
        if (notif.payload_data) {
          try {
            const payload = typeof notif.payload_data === 'string' 
              ? JSON.parse(notif.payload_data) 
              : notif.payload_data;
            console.log(`     Type: ${payload.notification_type || 'N/A'}`);
          } catch (e) {
            // Ignore parse errors
          }
        }
        console.log('');
      });
    } else {
      console.log('⚠️  No WhatsApp notifications found in database');
    }

    // ============================================================================
    // TEST 3: Analyze the pattern
    // ============================================================================
    console.log('\n📊 TEST 3: Analyze phone number patterns\n');

    const analysis = await db.one(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN LENGTH(phone) = 10 THEN 1 END) as ten_digit_phones,
        COUNT(CASE WHEN LENGTH(phone) = 12 THEN 1 END) as twelve_digit_phones,
        COUNT(CASE WHEN LENGTH(phone) = 13 THEN 1 END) as thirteen_digit_phones,
        COUNT(CASE WHEN phone LIKE '91%' THEN 1 END) as starts_with_91,
        COUNT(CASE WHEN phone LIKE '+91%' THEN 1 END) as starts_with_plus91
      FROM notifications
      WHERE channel = 'WHATSAPP';
    `);

    console.log('✅ WhatsApp notification phone patterns:');
    console.log(`   Total notifications: ${analysis.total_notifications}`);
    console.log(`   10-digit phones: ${analysis.ten_digit_phones}`);
    console.log(`   12-digit phones (91xxxxxxxxxx): ${analysis.twelve_digit_phones}`);
    console.log(`   13-digit phones (+91xxxxxxxxxx): ${analysis.thirteen_digit_phones}`);
    console.log(`   Starts with 91: ${analysis.starts_with_91}`);
    console.log(`   Starts with +91: ${analysis.starts_with_plus91}`);

    // ============================================================================
    // CONCLUSION
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 CONCLUSION:\n');

    if (parseInt(analysis.twelve_digit_phones) > 0 || parseInt(analysis.starts_with_91) > 0) {
      console.log('✅ Gallabox IS receiving phone numbers WITH country code (91)');
      console.log('   Format being sent: 91xxxxxxxxxx (12 digits)');
      console.log('   This means the backend is adding "91" somewhere before sending to Gallabox');
    } else if (parseInt(analysis.ten_digit_phones) > 0) {
      console.log('⚠️  Gallabox is receiving 10-digit phone numbers WITHOUT country code');
      console.log('   Format being sent: xxxxxxxxxx (10 digits)');
      console.log('   If WhatsApp messages are working, Gallabox might be auto-adding country code');
    } else {
      console.log('⚠️  No WhatsApp notifications found to analyze');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

checkGallaboxPhoneHandling();
