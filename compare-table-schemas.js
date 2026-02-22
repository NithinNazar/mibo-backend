const { db } = require('./dist/config/db');
const fs = require('fs');
const path = require('path');

async function compareTableSchemas() {
  console.log('🔍 THOROUGH SCHEMA COMPARISON\n');
  console.log('=' .repeat(80));

  try {
    // ============================================================================
    // PART 1: Get actual database schemas
    // ============================================================================
    console.log('\n📊 PART 1: Actual Database Table Schemas\n');

    // Get video_sessions schema
    console.log('📋 Table: video_sessions');
    const videoSessionsSchema = await db.any(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'video_sessions'
      ORDER BY ordinal_position;
    `);
    console.log('   Columns:');
    videoSessionsSchema.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Get notifications schema
    console.log('\n📋 Table: notifications');
    const notificationsSchema = await db.any(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    console.log('   Columns:');
    notificationsSchema.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // ============================================================================
    // PART 2: Analyze backend code expectations
    // ============================================================================
    console.log('\n\n📊 PART 2: Backend Code Analysis\n');

    // Search for appointment_video_links references
    console.log('🔍 Searching for "appointment_video_links" in backend code...');
    const videoLinksRefs = await searchInFiles('appointment_video_links', 'backend/src');
    console.log(`   Found ${videoLinksRefs.length} references`);
    videoLinksRefs.forEach(ref => console.log(`     - ${ref}`));

    // Search for notification_logs references
    console.log('\n🔍 Searching for "notification_logs" in backend code...');
    const notificationLogsRefs = await searchInFiles('notification_logs', 'backend/src');
    console.log(`   Found ${notificationLogsRefs.length} references`);
    notificationLogsRefs.forEach(ref => console.log(`     - ${ref}`));

    // ============================================================================
    // PART 3: Check what columns the code expects
    // ============================================================================
    console.log('\n\n📊 PART 3: Expected Columns from Code\n');

    // Read video.repository.ts to see what columns it expects
    console.log('📄 Analyzing video.repository.ts...');
    try {
      const videoRepoPath = path.join(__dirname, 'src/repositories/video.repository.ts');
      if (fs.existsSync(videoRepoPath)) {
        const videoRepoContent = fs.readFileSync(videoRepoPath, 'utf8');
        
        // Extract SELECT queries
        const selectMatches = videoRepoContent.match(/SELECT[\s\S]*?FROM\s+appointment_video_links/gi);
        if (selectMatches) {
          console.log('   Expected columns from SELECT queries:');
          selectMatches.forEach((match, i) => {
            console.log(`     Query ${i + 1}:`);
            console.log(`     ${match.substring(0, 200)}...`);
          });
        }

        // Extract INSERT queries
        const insertMatches = videoRepoContent.match(/INSERT INTO\s+appointment_video_links[\s\S]*?\)/gi);
        if (insertMatches) {
          console.log('\n   Expected columns from INSERT queries:');
          insertMatches.forEach((match, i) => {
            console.log(`     Query ${i + 1}:`);
            console.log(`     ${match.substring(0, 200)}...`);
          });
        }
      } else {
        console.log('   ⚠️  video.repository.ts not found');
      }
    } catch (err) {
      console.log(`   ⚠️  Error reading video.repository.ts: ${err.message}`);
    }

    // Read notification.repository.ts
    console.log('\n📄 Analyzing notification.repository.ts...');
    try {
      const notifRepoPath = path.join(__dirname, 'src/repositories/notification.repository.ts');
      if (fs.existsSync(notifRepoPath)) {
        const notifRepoContent = fs.readFileSync(notifRepoPath, 'utf8');
        
        // Extract SELECT queries
        const selectMatches = notifRepoContent.match(/SELECT[\s\S]*?FROM\s+notification_logs/gi);
        if (selectMatches) {
          console.log('   Expected columns from SELECT queries:');
          selectMatches.forEach((match, i) => {
            console.log(`     Query ${i + 1}:`);
            console.log(`     ${match.substring(0, 200)}...`);
          });
        }

        // Extract INSERT queries
        const insertMatches = notifRepoContent.match(/INSERT INTO\s+notification_logs[\s\S]*?\)/gi);
        if (insertMatches) {
          console.log('\n   Expected columns from INSERT queries:');
          insertMatches.forEach((match, i) => {
            console.log(`     Query ${i + 1}:`);
            console.log(`     ${match.substring(0, 200)}...`);
          });
        }
      } else {
        console.log('   ⚠️  notification.repository.ts not found');
      }
    } catch (err) {
      console.log(`   ⚠️  Error reading notification.repository.ts: ${err.message}`);
    }

    // ============================================================================
    // PART 4: Compatibility Analysis
    // ============================================================================
    console.log('\n\n📊 PART 4: Compatibility Analysis\n');
    console.log('=' .repeat(80));

    console.log('\n🔍 VIDEO TABLES COMPARISON:');
    console.log('   Code expects: appointment_video_links');
    console.log('   Database has: video_sessions');
    console.log('   Status: ❓ NEEDS MANUAL VERIFICATION');
    console.log('   Action: Check if column names match between code expectations and video_sessions');

    console.log('\n🔍 NOTIFICATION TABLES COMPARISON:');
    console.log('   Code expects: notification_logs');
    console.log('   Database has: notifications');
    console.log('   Status: ❓ NEEDS MANUAL VERIFICATION');
    console.log('   Action: Check if column names match between code expectations and notifications');

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Helper function to search for text in files
async function searchInFiles(searchText, directory) {
  const results = [];
  
  function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
        searchDirectory(filePath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes(searchText)) {
            // Count occurrences
            const matches = content.match(new RegExp(searchText, 'g'));
            results.push(`${filePath.replace(__dirname + '/', '')} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
          }
        } catch (err) {
          // Skip files that can't be read
        }
      }
    });
  }
  
  try {
    searchDirectory(directory);
  } catch (err) {
    console.error(`Error searching directory: ${err.message}`);
  }
  
  return results;
}

compareTableSchemas();
