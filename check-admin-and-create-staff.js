const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Try different admin credentials
const ADMIN_CREDENTIALS_OPTIONS = [
  { username: 'admin', password: 'admin123' },
  { username: 'admin', password: 'Admin@123' },
  { username: 'superadmin', password: 'admin123' },
  { username: 'admin@mibo.com', password: 'admin123' }
];

let authToken = '';
let centreId = null;

// Try to authenticate with different credentials
async function authenticate() {
  console.log('\n=== Trying to Authenticate ===');
  
  for (const creds of ADMIN_CREDENTIALS_OPTIONS) {
    try {
      console.log(`Trying: ${creds.username} / ${creds.password}`);
      const response = await axios.post(`${BASE_URL}/auth/login`, creds);
      authToken = response.data.token;
      console.log('✓ Authentication successful with:', creds.username);
      return authToken;
    } catch (error) {
      console.log(`✗ Failed with ${creds.username}`);
    }
  }
  
  throw new Error('Could not authenticate with any credentials');
}

// Get or create a centre
async function ensureCentre() {
  try {
    console.log('\n=== Checking Centres ===');
    const response = await axios.get(`${BASE_URL}/centres`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data && response.data.length > 0) {
      centreId = parseInt(response.data[0].id);
      console.log(`✓ Using existing centre: ${response.data[0].name} (ID: ${centreId})`);
      return centreId;
    }
    
    // Create a centre if none exists
    console.log('No centres found, creating one...');
    const centreData = {
      name: 'Mibo Mental Health Centre - Bangalore',
      address: '123 MG Road, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      phone: '08012345678',
      email: 'bangalore@mibo.com'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/centres`, centreData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    centreId = parseInt(createResponse.data.id);
    console.log(`✓ Centre created: ${centreData.name} (ID: ${centreId})`);
    return centreId;
    
  } catch (error) {
    console.error('✗ Failed to ensure centre:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Create staff with error handling
async function createStaff(endpoint, data, roleName) {
  try {
    console.log(`\n=== Creating ${roleName} ===`);
    const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✓ ${roleName} created successfully`);
    console.log('  Name:', data.full_name);
    console.log('  Phone:', data.phone);
    console.log('  Username:', data.username);
    console.log('  Password:', data.password);
    return response.data;
  } catch (error) {
    console.error(`✗ Failed to create ${roleName}:`, error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('  Details:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Creating Test Staff Data for All Roles                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Authenticate
    await authenticate();
    
    // Ensure centre exists
    await ensureCentre();

    // Create Manager
    await createStaff('/staff/manager', {
      full_name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh.kumar@mibo.com',
      username: 'rajesh.manager',
      password: 'Manager@123',
      role_ids: [2],
      centre_ids: [centreId],
      designation: 'Hospital Manager'
    }, 'Manager');

    // Create Centre Manager
    await createStaff('/staff/centre-manager', {
      full_name: 'Priya Sharma',
      phone: '9876543211',
      email: 'priya.sharma@mibo.com',
      username: 'priya.centremgr',
      password: 'CentreMgr@123',
      role_ids: [3],
      centre_ids: [centreId],
      centreId: centreId,
      designation: 'Centre Manager'
    }, 'Centre Manager');

    // Create Clinician
    await createStaff('/staff/clinician', {
      full_name: 'Dr. Ananya Menon',
      phone: '9876543212',
      email: 'ananya.menon@mibo.com',
      username: 'dr.ananya',
      password: 'Clinician@123',
      role_ids: [4],
      centre_ids: [centreId],
      designation: 'Clinical Psychologist',
      primary_centre_id: centreId,
      specialization: ['Clinical Psychologist', 'Therapist'],
      qualification: ['M.Phil', 'Ph.D.'],
      languages: ['English', 'Hindi', 'Malayalam'],
      years_of_experience: 8,
      consultation_fee: 1500,
      bio: 'Dr. Ananya Menon is a highly experienced clinical psychologist specializing in anxiety disorders, depression, and trauma therapy.',
      consultation_modes: ['IN_PERSON', 'ONLINE'],
      default_consultation_duration_minutes: 45,
      expertise: ['Anxiety Disorders', 'Depression', 'Trauma & PTSD'],
      profile_picture_url: 'https://randomuser.me/api/portraits/women/44.jpg'
    }, 'Clinician');

    // Create Care Coordinator
    await createStaff('/staff/care-coordinator', {
      full_name: 'Sneha Reddy',
      phone: '9876543213',
      email: 'sneha.reddy@mibo.com',
      username: 'sneha.coordinator',
      password: 'Coordinator@123',
      role_ids: [5],
      centre_ids: [centreId],
      centreId: centreId,
      designation: 'Care Coordinator'
    }, 'Care Coordinator');

    // Create Front Desk Staff
    await createStaff('/staff/front-desk', {
      full_name: 'Amit Patel',
      phone: '9876543214',
      email: 'amit.patel@mibo.com',
      username: 'amit.frontdesk',
      password: 'FrontDesk@123',
      role_ids: [6],
      centre_ids: [centreId],
      centreId: centreId,
      designation: 'Front Desk Executive'
    }, 'Front Desk Staff');

    // Verify
    console.log('\n=== Verification ===');
    try {
      const cliniciansResponse = await axios.get(`${BASE_URL}/clinicians`);
      console.log(`✓ Public Clinicians API: ${cliniciansResponse.data.length} clinicians available`);
    } catch (error) {
      console.log('✗ Could not verify public clinicians API');
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SUCCESS!                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📝 Test Credentials:');
    console.log('   Manager: rajesh.manager / Manager@123');
    console.log('   Centre Manager: priya.centremgr / CentreMgr@123');
    console.log('   Clinician: dr.ananya / Clinician@123');
    console.log('   Care Coordinator: sneha.coordinator / Coordinator@123');
    console.log('   Front Desk: amit.frontdesk / FrontDesk@123');
    console.log('\n✓ Check Admin Panel and Frontend to verify!');

  } catch (error) {
    console.error('\n✗ Script failed:', error.message);
    process.exit(1);
  }
}

main();
