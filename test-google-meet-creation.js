// Test Google Meet link creation directly
const { googleMeetUtil } = require('./dist/utils/google-meet');

async function testMeetCreation() {
  try {
    console.log('🧪 Testing Google Meet Link Creation\n');
    console.log('=' .repeat(60));
    
    // Test data
    const testData = {
      patientName: 'Test Patient',
      clinicianName: 'Dr. Test Clinician',
      appointmentDate: '2026-01-10', // YYYY-MM-DD
      appointmentTime: '14:30', // HH:MM
      durationMinutes: 50
    };
    
    console.log('\n📋 Test Data:');
    console.log(`   Patient: ${testData.patientName}`);
    console.log(`   Clinician: ${testData.clinicianName}`);
    console.log(`   Date: ${testData.appointmentDate}`);
    console.log(`   Time: ${testData.appointmentTime}`);
    console.log(`   Duration: ${testData.durationMinutes} minutes`);
    
    console.log('\n📹 Creating Google Meet link...');
    
    const result = await googleMeetUtil.createMeetingLink(testData);
    
    console.log('\n✅ SUCCESS! Google Meet link created:');
    console.log(`   Meet Link: ${result.meetLink}`);
    console.log(`   Event ID: ${result.eventId}`);
    console.log(`   Start Time: ${result.startTime}`);
    console.log(`   End Time: ${result.endTime}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Google Meet integration is working correctly!');
    console.log('\nYou can now book an ONLINE appointment and complete payment.');
    console.log('The Google Meet link will be created automatically.');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR creating Google Meet link:');
    console.error('   Message:', error.message);
    console.error('\n   Full error:', error);
    
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Check if domain-wide delegation is configured');
    console.log('   2. Verify service account has Calendar API access');
    console.log('   3. Check if reach@mibocare.com is in Google Workspace');
    console.log('   4. Review Google Cloud Console for any errors');
    
    process.exit(1);
  }
}

testMeetCreation();
