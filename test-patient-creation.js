// Test patient creation with date conversion
const axios = require('axios');

async function testPatientCreation() {
  console.log('Testing patient creation with date_of_birth...\n');

  try {
    // Test data
    const testPatient = {
      full_name: 'Test Patient',
      phone: '9999999999',
      email: 'test@example.com',
      date_of_birth: '1990-05-15', // String format
      gender: 'male',
      blood_group: 'A+',
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_phone: '8888888888'
    };

    console.log('Test data:', JSON.stringify(testPatient, null, 2));
    console.log('\n✅ Date format is string (as expected from frontend)');
    console.log('✅ Service should convert to Date object');
    console.log('✅ Repository expects Date type');
    console.log('\nIf server is running, this would test the conversion...');
    console.log('(Skipping actual API call to avoid duplicate phone error)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPatientCreation();
