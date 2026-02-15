// Test script to verify enhanced validation
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const validClinicianData = {
  full_name: 'Dr. Test Clinician',
  phone: '9876543210',
  email: 'test.clinician@example.com',
  username: 'testclinician',
  password: 'TestPass123',
  role_ids: [3], // Clinician role
  centre_ids: [1],
  primary_centre_id: 1,
  specialization: ['Psychiatry', 'Counseling'],
  qualification: ['MBBS', 'MD Psychiatry'],
  languages: ['English', 'Hindi'],
  consultation_fee: 1500,
  years_of_experience: 5,
  bio: 'Experienced psychiatrist',
  consultation_modes: ['IN_PERSON', 'ONLINE'],
  default_consultation_duration_minutes: 30,
  expertise: ['Depression', 'Anxiety']
};

async function testValidation() {
  console.log('=== Testing Enhanced Validation ===\n');

  // Test 1: Valid data should succeed
  console.log('Test 1: Valid clinician data');
  try {
    const response = await axios.post(`${API_BASE_URL}/staff/clinicians`, validClinicianData);
    console.log('✓ Valid data accepted');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('✗ Unexpected error:', error.response?.data?.message || error.message);
  }
  console.log('\n---\n');

  // Test 2: Missing specialization (required array)
  console.log('Test 2: Missing specialization');
  try {
    const data = { ...validClinicianData };
    delete data.specialization;
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 3: Empty specialization array
  console.log('Test 3: Empty specialization array');
  try {
    const data = { ...validClinicianData, specialization: [] };
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 4: Missing qualification (required array)
  console.log('Test 4: Missing qualification');
  try {
    const data = { ...validClinicianData };
    delete data.qualification;
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 5: Empty qualification array
  console.log('Test 5: Empty qualification array');
  try {
    const data = { ...validClinicianData, qualification: [] };
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 6: Missing languages (required array)
  console.log('Test 6: Missing languages');
  try {
    const data = { ...validClinicianData };
    delete data.languages;
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 7: Empty languages array
  console.log('Test 7: Empty languages array');
  try {
    const data = { ...validClinicianData, languages: [] };
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 8: Missing consultation_fee (required)
  console.log('Test 8: Missing consultation_fee');
  try {
    const data = { ...validClinicianData };
    delete data.consultation_fee;
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 9: Zero consultation_fee
  console.log('Test 9: Zero consultation_fee');
  try {
    const data = { ...validClinicianData, consultation_fee: 0 };
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 10: Negative consultation_fee
  console.log('Test 10: Negative consultation_fee');
  try {
    const data = { ...validClinicianData, consultation_fee: -100 };
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 11: Negative years_of_experience
  console.log('Test 11: Negative years_of_experience');
  try {
    const data = { ...validClinicianData, years_of_experience: -5 };
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  // Test 12: Invalid consultation_modes
  console.log('Test 12: Invalid consultation_modes');
  try {
    const data = { ...validClinicianData, consultation_modes: ['INVALID_MODE'] };
    await axios.post(`${API_BASE_URL}/staff/clinicians`, data);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    console.log('✓ Correctly rejected:', error.response?.data?.message);
  }
  console.log('\n---\n');

  console.log('=== Validation Tests Complete ===');
}

// Run tests
testValidation().catch(console.error);
