const axios = require('axios');

(async () => {
  try {
    console.log('\n=== TESTING SLOTS API ===\n');
    
    const clinicianId = 48;
    const date = '2024-02-21'; // Wednesday (day 3)
    const centreId = 1;
    
    const url = `http://localhost:5000/api/users/clinicians/${clinicianId}/slots?date=${date}&centreId=${centreId}`;
    
    console.log('Testing URL:', url);
    console.log('');
    
    const response = await axios.get(url);
    
    console.log('Status:', response.status);
    console.log('Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data) {
      console.log(`\n✓ Received ${response.data.data.length} slots`);
      if (response.data.data.length > 0) {
        console.log('\nFirst slot:');
        console.log(JSON.stringify(response.data.data[0], null, 2));
      }
    } else {
      console.log('\n❌ No data in response');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Response:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
