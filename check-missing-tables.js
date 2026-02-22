const { db } = require('./dist/config/db');

async function checkMissingTables() {
  console.log('🔍 Checking for missing tables in database...\n');
  console.log('=' .repeat(70));

  try {
    // Check if appointment_video_links table exists
    console.log('\n📋 Checking: appointment_video_links');
    const videoLinksExists = await db.oneOrNone(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'appointment_video_links'
      );
    `);
    console.log(`   Status: ${videoLinksExists.exists ? '✅ EXISTS' : '❌ MISSING'}`);

    if (videoLinksExists.exists) {
      const videoLinksCount = await db.one('SELECT COUNT(*) FROM appointment_video_links');
      console.log(`   Records: ${videoLinksCount.count}`);
      
      const videoLinksSchema = await db.any(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'appointment_video_links'
        ORDER BY ordinal_position;
      `);
      console.log('   Columns:', videoLinksSchema.map(c => c.column_name).join(', '));
    }

    // Check if notification_logs table exists
    console.log('\n📋 Checking: notification_logs');
    const notificationLogsExists = await db.oneOrNone(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_logs'
      );
    `);
    console.log(`   Status: ${notificationLogsExists.exists ? '✅ EXISTS' : '❌ MISSING'}`);

    if (notificationLogsExists.exists) {
      const notificationLogsCount = await db.one('SELECT COUNT(*) FROM notification_logs');
      console.log(`   Records: ${notificationLogsCount.count}`);
      
      const notificationLogsSchema = await db.any(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'notification_logs'
        ORDER BY ordinal_position;
      `);
      console.log('   Columns:', notificationLogsSchema.map(c => c.column_name).join(', '));
    }

    // List all tables in the database
    console.log('\n📊 All tables in database:');
    const allTables = await db.any(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    allTables.forEach(t => console.log(`   - ${t.table_name}`));

    console.log('\n' + '='.repeat(70));
    console.log('\n💡 Analysis:');
    
    if (!videoLinksExists.exists) {
      console.log('\n❌ appointment_video_links table is MISSING');
      console.log('   Purpose: Stores Google Meet links for online appointments');
      console.log('   Used by: video.service.ts to generate and retrieve meeting links');
      console.log('   Impact: Online appointments cannot store/retrieve video links');
    }

    if (!notificationLogsExists.exists) {
      console.log('\n❌ notification_logs table is MISSING');
      console.log('   Purpose: Logs all notifications sent (WhatsApp, Email, SMS)');
      console.log('   Used by: notification.service.ts to track notification delivery');
      console.log('   Impact: Cannot track notification history or debug delivery issues');
    }

    console.log('\n📝 Recommendation:');
    console.log('   Run database migrations to create missing tables');
    console.log('   Check: backend/migrations/ folder for migration files');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkMissingTables();
