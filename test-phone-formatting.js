// Test phone number formatting logic
console.log('📱 Testing Phone Number Formatting Logic\n');
console.log('=' .repeat(80));

// Simulate the formatPhoneNumber function
function formatPhoneNumber(phone) {
  // Remove all non-digit characters (+, spaces, dashes, etc.)
  const cleanPhone = phone.replace(/\D/g, "");
  
  // If phone number is 10 digits, add country code 91
  // If it's 12 digits and starts with 91, keep as is
  // If it's 13 digits and starts with 91, remove leading digit (handles +91 case)
  if (cleanPhone.length === 10) {
    return `91${cleanPhone}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
    return cleanPhone;
  } else if (cleanPhone.length === 13 && cleanPhone.startsWith("91")) {
    // Handle case where +91 was converted to 91 but kept an extra digit
    return cleanPhone.substring(1);
  }
  
  // For any other case, return as is (shouldn't happen with valid Indian numbers)
  return cleanPhone;
}

// Test cases
const testCases = [
  { input: '9048810697', expected: '919048810697', description: '10 digits without country code' },
  { input: '919048810697', expected: '919048810697', description: '12 digits with country code' },
  { input: '+919048810697', expected: '919048810697', description: '13 chars with +91' },
  { input: '+91 9048810697', expected: '919048810697', description: 'With +91 and space' },
  { input: '91-9048810697', expected: '919048810697', description: 'With 91 and dash' },
  { input: '904-881-0697', expected: '919048810697', description: '10 digits with dashes' },
  { input: '9876543210', expected: '919876543210', description: 'Another 10 digit number' },
  { input: '919876543210', expected: '919876543210', description: 'Another 12 digit number' },
];

console.log('\n📊 Running Test Cases:\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = formatPhoneNumber(test.input);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Description: ${test.description}`);
  console.log(`  Input:       "${test.input}"`);
  console.log(`  Expected:    "${test.expected}"`);
  console.log(`  Got:         "${result}"`);
  console.log('');
});

console.log('=' .repeat(80));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All tests passed! Phone formatting is working correctly.\n');
} else {
  console.log('❌ Some tests failed. Please review the logic.\n');
}
