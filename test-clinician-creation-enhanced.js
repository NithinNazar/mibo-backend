// Enhanced test script for clinician creation against live database
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Admin credentials for authentication
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;

// Helper to get auth token
async function getAuthToken() {
  if (authToken) return authToken;
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login/username-password`, ADMIN_CREDENTIALS);
    authToken = response.data.token;
    console.log('✓ Authenticated successfully\n');
    return authToken;
  } catch (error) {
    console.error('✗ Authentication failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Helper to make authenticated requests
async function authenticatedRequest(method, url, data = null) {
  const token = await getAuthToken();
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// Helper to generate unique phone number
function generateUniquePhone() {
  const timestamp = Date.now().toString().slice(-10);
  return timestamp;
}

// Helper to generate unique username
function generateUniqueUsername() {
  return `testclinician_${Date.now()}`;
}

// Test data generator
function generateClinicianData() {
  return {
    full_name: `Dr. Test Clinician ${Date.now()}`,
    phone: generateUniquePhone(),
    email: `test${Date.now()}@example.com`,
    username: generateUniqueUsername(),
    password: 'TestPass123',
    role_ids: [4], // Clinician role
    centre_ids: [1],
    primary_centre_id: 1,
    specialization: ['Psychiatry', 'Counseling'],
    qualification: ['MBBS', 'MD Psychiatry'],
    languages: ['English', 'Hindi'],
    consultation_fee: 1500,
    years_of_experience: 5,
    bio: 'Experienced psychiatrist specializing in depression and anxiety',
    consultation_modes: ['IN_PERSON', 'ONLINE'],
    default_consultation_duration_minutes: 30,
    expertise: ['Depression', 'Anxiety', 'Stress Management']
  };
}

async function runTests() {
  console.log('=== Testing Backend API Against Live Database ===\n');
  
  // Authenticate first
  try {
    await getAuthToken();
  } catch (error) {
    console.error('Cannot proceed without authentication');
    return;
  }
  
  let createdClinicianId = null;

  // Test 1: Create clinician with all required fields
  console.log('Test 1: Create clinician with all required fields');
  try {
    const data = generateClinicianData();
    const response = await authenticatedRequest('POST', `${API_BASE_URL}/clinicians`, data);
    console.log('✓ Clinician created successfully');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    createdClinicianId = response.data.id;
    
    // Verify response structure
    if (response.data.specialization && Array.isArray(response.data.specialization)) {
      console.log('✓ Specialization is an array');
    } else {
      console.log('✗ Specialization is not an array:', typeof response.data.specialization);
    }
    
    if (response.data.qualification && Array.isArray(response.data.qualification)) {
      console.log('✓ Qualification is an array');
    } else {
      console.log('✗ Qualification is not an array:', typeof response.data.qualification);
    }
    
    if (response.data.languages && Array.isArray(response.data.languages)) {
      console.log('✓ Languages is an array');
    } else {
      console.log('✗ Languages is not an array:', typeof response.data.languages);
    }
    
    if (response.data.consultationFee && response.data.consultationFee > 0) {
      console.log('✓ Consultation fee is positive');
    } else {
      console.log('✗ Consultation fee issue:', response.data.consultationFee);
    }
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.message || error.message);
  }
  console.log('\n---\n');

  // Test 2: Create clinician with availability slots
  console.log('Test 2: Create clinician with availability slots');
  try {
    const data = generateClinicianData();
    data.availability_slots = [
      {
        centre_id: 1,
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
        slot_duration_minutes: 30,
        consultation_mode: 'IN_PERSON'
      },
      {
        centre_id: 1,
        day_of_week: 2, // Tuesday
        start_time: '10:00',
        end_time: '16:00',
        slot_duration_minutes: 30,
        consultation_mode: 'ONLINE'
      }
    ];
    
    const response = await authenticatedRequest('POST', `${API_BASE_URL}/clinicians`, data);
    console.log('✓ Clinician with availability slots created');
    console.log('Clinician ID:', response.data.id);
    
    // Fetch clinician to verify availability slots
    const clinicianResponse = await axios.get(`${API_BASE_URL}/clinicians/${response.data.id}`);
    if (clinicianResponse.data.availabilityRules && clinicianResponse.data.availabilityRules.length > 0) {
      console.log('✓ Availability slots stored correctly');
      console.log('Slots:', JSON.stringify(clinicianResponse.data.availabilityRules, null, 2));
    } else {
      console.log('⚠ No availability slots found in response');
    }
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.message || error.message);
  }
  console.log('\n---\n');

  // Test 3: Duplicate phone number error
  console.log('Test 3: Duplicate phone number error');
  try {
    const data1 = generateClinicianData();
    const phone = data1.phone;
    
    // Create first clinician
    await authenticatedRequest('POST', `${API_BASE_URL}/clinicians`, data1);
    
    // Try to create second clinician with same phone
    const data2 = generateClinicianData();
    data2.phone = phone;
    data2.username = generateUniqueUsername(); // Different username
    
    await authenticatedRequest('POST', `${API_BASE_URL}/clinicians`, data2);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 409 && error.response?.data?.message.includes('phone')) {
      console.log('✓ Correctly rejected duplicate phone:', error.response.data.message);
    } else {
      console.log('✗ Wrong error:', error.response?.data?.message || error.message);
    }
  }
  console.log('\n---\n');

  // Test 4: Duplicate username error
  console.log('Test 4: Duplicate username error');
  try {
    const data1 = generateClinicianData();
    const username = data1.username;
    
    // Create first clinician
    await authenticatedRequest('POST', `${API_BASE_URL}/clinicians`, data1);
    
    // Try to create second clinician with same username
    const data2 = generateClinicianData();
    data2.username = username;
    
    await authenticatedRequest('POST', `${API_BASE_URL}/clinicians`, data2);
    console.log('✗ Should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 409 && error.response?.data?.message.includes('username')) {
      console.log('✓ Correctly rejected duplicate username:', error.response.data.message);
    } else {
      console.log('✗ Wrong error:', error.response?.data?.message || error.message);
    }
  }
  console.log('\n---\n');

  // Test 5: Array field storage and retrieval
  console.log('Test 5: Array field storage and retrieval');
  try {
    const data = generateClinicianData();
    data.specialization = ['Psychiatry', 'Clinical Psychology', 'Counseling'];
    data.qualification = ['MBBS', 'MD Psychiatry', 'PhD Psychology'];
    data.languages = ['English', 'Hindi', 'Tamil', 'Malayalam'];
    data.expertise = ['Depression', 'Anxiety', 'PTSD', 'OCD'];
    
    const createResponse = await authenticatedRequest('POST', `${API_BASE_URL}/clinicians`, data);
    const clinicianId = createResponse.data.id;
    
    // Fetch the clinician
    const getResponse = await axios.get(`${API_BASE_URL}/clinicians/${clinicianId}`);
    const clinician = getResponse.data;
    
    console.log('✓ Clinician retrieved');
    
    // Verify arrays
    if (Array.isArray(clinician.specialization) && clinician.specialization.length === 3) {
      console.log('✓ Specialization array correct:', clinician.specialization);
    } else {
      console.log('✗ Specialization array issue:', clinician.specialization);
    }
    
    if (Array.isArray(clinician.qualification) && clinician.qualification.length === 3) {
      console.log('✓ Qualification array correct:', clinician.qualification);
    } else {
      console.log('✗ Qualification array issue:', clinician.qualification);
    }
    
    if (Array.isArray(clinician.languages) && clinician.languages.length === 4) {
      console.log('✓ Languages array correct:', clinician.languages);
    } else {
      console.log('✗ Languages array issue:', clinician.languages);
    }
    
    if (Array.isArray(clinician.expertise) && clinician.expertise.length === 4) {
      console.log('✓ Expertise array correct:', clinician.expertise);
    } else {
      console.log('✗ Expertise array issue:', clinician.expertise);
    }
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.message || error.message);
  }
  console.log('\n---\n');

  // Test 6: Response transformation (snake_case to camelCase)
  console.log('Test 6: Response transformation (snake_case to camelCase)');
  try {
    const data = generateClinicianData();
    const response = await authenticatedRequest('POST', `${API_BASE_URL}/clinicians`, data);
    const clinician = response.data;
    
    console.log('✓ Clinician created');
    
    // Check camelCase fields
    const camelCaseFields = [
      'userId',
      'primaryCentreId',
      'yearsOfExperience',
      'consultationFee',
      'consultationModes',
      'defaultDurationMinutes',
      'isActive',
      'createdAt',
      'updatedAt'
    ];
    
    let allCorrect = true;
    for (const field of camelCaseFields) {
      if (clinician[field] !== undefined) {
        console.log(`✓ ${field} is present`);
      } else {
        console.log(`✗ ${field} is missing`);
        allCorrect = false;
      }
    }
    
    // Check that snake_case fields are NOT present
    const snakeCaseFields = [
      'user_id',
      'primary_centre_id',
      'years_of_experience',
      'consultation_fee',
      'consultation_modes',
      'is_active',
      'created_at',
      'updated_at'
    ];
    
    for (const field of snakeCaseFields) {
      if (clinician[field] === undefined) {
        console.log(`✓ ${field} correctly transformed`);
      } else {
        console.log(`✗ ${field} still present (should be camelCase)`);
        allCorrect = false;
      }
    }
    
    if (allCorrect) {
      console.log('✓ All field transformations correct');
    }
  } catch (error) {
    console.log('✗ Failed:', error.response?.data?.message || error.message);
  }
  console.log('\n---\n');

  console.log('=== All Tests Complete ===');
}

// Run tests
runTests().catch(console.error);
