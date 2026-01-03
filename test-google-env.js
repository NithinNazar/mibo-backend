// Test if Google credentials are set
require('dotenv').config();

console.log('🔍 Checking Google credentials...\n');

if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  try {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    console.log('✅ Environment variable found');
    console.log('✅ JSON is valid');
    console.log('✅ Project:', creds.project_id);
    console.log('✅ Email:', creds.client_email);
    console.log('\n✅ Ready to use!');
    process.exit(0);
  } catch (error) {
    console.log('❌ Environment variable found but JSON is invalid');
    console.log('Error:', error.message);
    process.exit(1);
  }
} else {
  console.log('⚠️  Environment variable not set');
  console.log('Looking for file instead...');
  
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'clinic-booking-system-483212-31e92efb492d.json');
  
  if (fs.existsSync(filePath)) {
    console.log('✅ File found:', filePath);
    console.log('✅ Ready to use!');
    process.exit(0);
  } else {
    console.log('❌ File not found:', filePath);
    console.log('\n📝 You need to either:');
    console.log('   1. Download the JSON file from Google Cloud Console');
    console.log('   2. Set GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
    console.log('\n📖 See SETUP_GOOGLE_CREDENTIALS.md for instructions');
    process.exit(1);
  }
}
