const { db } = require('./dist/config/db');

async function checkPhoneFormat() {
  console.log('📱 Checking Phone Number Format\n');
  console.log('=' .repeat(80));

  try {
    // ============================================================================
    // TEST 1: Check actual phone numbers in database
    // ============================================================================
    console.log('\n📊 TEST 1: Check actual phone numbers in users table\n');

    const users = await db.any(`
      SELECT id, full_name, phone, email
      FROM users
      WHERE phone IS NOT NULL
      LIMIT 10;
    `);

    if (users.length > 0) {
      console.log(`✅ Found ${users.length} user(s) with phone numbers:\n`);
      users.forEach(user => {
        const phoneLength = user.phone ? user.phone.length : 0;
        const hasCountryCode = user.phone && user.phone.startsWith('+91');
        console.log(`   - ${user.full_name}`);
        console.log(`     Phone: ${user.phone}`);
        console.log(`     Length: ${phoneLength} characters`);
        console.log(`     Has +91: ${hasCountryCode ? 'YES' : 'NO'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No users with phone numbers found in database');
    }

    // ============================================================================
    // TEST 2: Check phone column constraints
    // ============================================================================
    console.log('\n📊 TEST 2: Check phone column constraints\n');

    const phoneColumn = await db.one(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'phone';
    `);

    console.log('✅ Phone column details:');
    console.log(`   - Type: ${phoneColumn.data_type}`);
    console.log(`   - Max Length: ${phoneColumn.character_maximum_length || 'unlimited'}`);
    console.log(`   - Nullable: ${phoneColumn.is_nullable}`);

    // ============================================================================
    // TEST 3: Check validation rules in backend
    // ============================================================================
    console.log('\n📊 TEST 3: Check validation rules in backend code\n');

    const fs = require('fs');
    const path = require('path');

    // Check auth validation
    const authValidationPath = path.join(__dirname, 'src/validations/auth.validation.ts');
    if (fs.existsSync(authValidationPath)) {
      const authValidation = fs.readFileSync(authValidationPath, 'utf8');
      
      // Look for phone validation patterns
      const phonePatterns = authValidation.match(/phone.*?(?:matches|pattern|regex|min|max).*?[,\)]/gi);
      
      if (phonePatterns) {
        console.log('✅ Found phone validation in auth.validation.ts:');
        phonePatterns.forEach(pattern => {
          console.log(`   ${pattern.trim()}`);
        });
      } else {
        console.log('⚠️  No specific phone validation pattern found in auth.validation.ts');
      }
    }

    // Check patient validation
    const patientValidationPath = path.join(__dirname, 'src/validations/patient.validation.ts');
    if (fs.existsSync(patientValidationPath)) {
      const patientValidation = fs.readFileSync(patientValidationPath, 'utf8');
      
      const phonePatterns = patientValidation.match(/phone.*?(?:matches|pattern|regex|min|max).*?[,\)]/gi);
      
      if (phonePatterns) {
        console.log('\n✅ Found phone validation in patient.validation.ts:');
        phonePatterns.forEach(pattern => {
          console.log(`   ${pattern.trim()}`);
        });
      }
    }

    // ============================================================================
    // TEST 4: Analyze phone format pattern
    // ============================================================================
    console.log('\n📊 TEST 4: Analyze phone format pattern\n');

    const phoneStats = await db.one(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN phone LIKE '+91%' THEN 1 END) as with_country_code,
        COUNT(CASE WHEN phone NOT LIKE '+91%' AND phone IS NOT NULL THEN 1 END) as without_country_code,
        COUNT(CASE WHEN LENGTH(phone) = 10 THEN 1 END) as ten_digits,
        COUNT(CASE WHEN LENGTH(phone) = 13 THEN 1 END) as thirteen_chars
      FROM users
      WHERE phone IS NOT NULL;
    `);

    console.log('✅ Phone format statistics:');
    console.log(`   - Total users with phone: ${phoneStats.total_users}`);
    console.log(`   - With +91 prefix: ${phoneStats.with_country_code}`);
    console.log(`   - Without +91 prefix: ${phoneStats.without_country_code}`);
    console.log(`   - 10 digits (no country code): ${phoneStats.ten_digits}`);
    console.log(`   - 13 characters (+91xxxxxxxxxx): ${phoneStats.thirteen_chars}`);

    // ============================================================================
    // CONCLUSION
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 CONCLUSION:\n');

    if (parseInt(phoneStats.with_country_code) > 0) {
      console.log('✅ Phone numbers are stored WITH +91 country code');
      console.log('   Format: +91xxxxxxxxxx (13 characters)');
      console.log('   Users should enter: +91 followed by 10 digits');
    } else if (parseInt(phoneStats.ten_digits) > 0) {
      console.log('✅ Phone numbers are stored WITHOUT +91 country code');
      console.log('   Format: xxxxxxxxxx (10 digits only)');
      console.log('   Users should enter: Just 10 digits');
    } else {
      console.log('⚠️  No clear pattern found - database might be empty');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

checkPhoneFormat();
