const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Admin credentials for authentication
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

// Authenticate as admin
async function authenticate() {
  try {
    console.log('\n=== Authenticating as Admin ===');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.token;
    console.log('✓ Authentication successful');
    return authToken;
  } catch (error) {
    console.error('✗ Authentication failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Get centres to assign staff
async function getCentres() {
  try {
    const response = await axios.get(`${BASE_URL}/centres`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  } catch (error) {
    console.error('✗ Failed to fetch centres:', error.response?.data?.message || error.message);
    return [];
  }
}

// Create Manager
async function createManager(centreId) {
  try {
    console.log('\n=== Creating Manager ===');
    const managerData = {
      full_name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh.kumar@mibo.com',
      username: 'rajesh.manager',
      password: 'Manager@123',
      role_ids: [2], // Manager role
      centre_ids: [centreId],
      designation: 'Hospital Manager'
    };

    const response = await axios.post(`${BASE_URL}/staff/manager`, managerData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ Manager created successfully');
    console.log('  Name:', managerData.full_name);
    console.log('  Phone:', managerData.phone);
    console.log('  Username:', managerData.username);
    console.log('  Password:', managerData.password);
    return response.data;
  } catch (error) {
    console.error('✗ Failed to create manager:', error.response?.data?.message || error.message);
    return null;
  }
}

// Create Centre Manager
async function createCentreManager(centreId) {
  try {
    console.log('\n=== Creating Centre Manager ===');
    const centreManagerData = {
      full_name: 'Priya Sharma',
      phone: '9876543211',
      email: 'priya.sharma@mibo.com',
      username: 'priya.centremgr',
      password: 'CentreMgr@123',
      role_ids: [3], // Centre Manager role
      centre_ids: [centreId],
      centreId: centreId,
      designation: 'Centre Manager'
    };

    const response = await axios.post(`${BASE_URL}/staff/centre-manager`, centreManagerData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ Centre Manager created successfully');
    console.log('  Name:', centreManagerData.full_name);
    console.log('  Phone:', centreManagerData.phone);
    console.log('  Username:', centreManagerData.username);
    console.log('  Password:', centreManagerData.password);
    return response.data;
  } catch (error) {
    console.error('✗ Failed to create centre manager:', error.response?.data?.message || error.message);
    return null;
  }
}

// Create Clinician
async function createClinician(centreId) {
  try {
    console.log('\n=== Creating Clinician ===');
    const clinicianData = {
      full_name: 'Dr. Ananya Menon',
      phone: '9876543212',
      email: 'ananya.menon@mibo.com',
      username: 'dr.ananya',
      password: 'Clinician@123',
      role_ids: [4], // Clinician role
      centre_ids: [centreId],
      designation: 'Clinical Psychologist',
      primary_centre_id: centreId,
      specialization: ['Clinical Psychologist', 'Therapist'],
      qualification: ['M.Phil', 'Ph.D.'],
      languages: ['English', 'Hindi', 'Malayalam'],
      years_of_experience: 8,
      consultation_fee: 1500,
      bio: 'Dr. Ananya Menon is a highly experienced clinical psychologist specializing in anxiety disorders, depression, and trauma therapy. With over 8 years of experience, she provides compassionate care to individuals and families.',
      consultation_modes: ['IN_PERSON', 'ONLINE'],
      default_consultation_duration_minutes: 45,
      expertise: ['Anxiety Disorders', 'Depression', 'Trauma & PTSD', 'Stress Management'],
      profile_picture_url: 'https://randomuser.me/api/portraits/women/44.jpg'
    };

    const response = await axios.post(`${BASE_URL}/staff/clinician`, clinicianData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ Clinician created successfully');
    console.log('  Name:', clinicianData.full_name);
    console.log('  Phone:', clinicianData.phone);
    console.log('  Username:', clinicianData.username);
    console.log('  Password:', clinicianData.password);
    console.log('  Specialization:', clinicianData.specialization.join(', '));
    console.log('  Consultation Fee: ₹', clinicianData.consultation_fee);
    return response.data;
  } catch (error) {
    console.error('✗ Failed to create clinician:', error.response?.data?.message || error.message);
    console.error('  Error details:', error.response?.data);
    return null;
  }
}

// Create Care Coordinator
async function createCareCoordinator(centreId) {
  try {
    console.log('\n=== Creating Care Coordinator ===');
    const careCoordinatorData = {
      full_name: 'Sneha Reddy',
      phone: '9876543213',
      email: 'sneha.reddy@mibo.com',
      username: 'sneha.coordinator',
      password: 'Coordinator@123',
      role_ids: [5], // Care Coordinator role
      centre_ids: [centreId],
      centreId: centreId,
      designation: 'Care Coordinator'
    };

    const response = await axios.post(`${BASE_URL}/staff/care-coordinator`, careCoordinatorData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ Care Coordinator created successfully');
    console.log('  Name:', careCoordinatorData.full_name);
    console.log('  Phone:', careCoordinatorData.phone);
    console.log('  Username:', careCoordinatorData.username);
    console.log('  Password:', careCoordinatorData.password);
    return response.data;
  } catch (error) {
    console.error('✗ Failed to create care coordinator:', error.response?.data?.message || error.message);
    return null;
  }
}

// Create Front Desk Staff
async function createFrontDeskStaff(centreId) {
  try {
    console.log('\n=== Creating Front Desk Staff ===');
    const frontDeskData = {
      full_name: 'Amit Patel',
      phone: '9876543214',
      email: 'amit.patel@mibo.com',
      username: 'amit.frontdesk',
      password: 'FrontDesk@123',
      role_ids: [6], // Front Desk role
      centre_ids: [centreId],
      centreId: centreId,
      designation: 'Front Desk Executive'
    };

    const response = await axios.post(`${BASE_URL}/staff/front-desk`, frontDeskData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ Front Desk Staff created successfully');
    console.log('  Name:', frontDeskData.full_name);
    console.log('  Phone:', frontDeskData.phone);
    console.log('  Username:', frontDeskData.username);
    console.log('  Password:', frontDeskData.password);
    return response.data;
  } catch (error) {
    console.error('✗ Failed to create front desk staff:', error.response?.data?.message || error.message);
    return null;
  }
}

// Verify staff in database
async function verifyStaff() {
  try {
    console.log('\n=== Verifying Created Staff ===');
    
    // Get all staff by role
    const roles = [
      { id: 2, name: 'Managers' },
      { id: 3, name: 'Centre Managers' },
      { id: 4, name: 'Clinicians' },
      { id: 5, name: 'Care Coordinators' },
      { id: 6, name: 'Front Desk Staff' }
    ];

    for (const role of roles) {
      try {
        const response = await axios.get(`${BASE_URL}/staff/role/${role.id}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(`✓ ${role.name}: ${response.data.length} found`);
      } catch (error) {
        console.log(`✗ ${role.name}: Failed to fetch`);
      }
    }

    // Get clinicians specifically for frontend
    try {
      const response = await axios.get(`${BASE_URL}/clinicians`);
      console.log(`\n✓ Public Clinicians API: ${response.data.length} clinicians available for frontend`);
      if (response.data.length > 0) {
        console.log('  Sample clinician:', response.data[0].fullName || response.data[0].name);
      }
    } catch (error) {
      console.log('✗ Public Clinicians API: Failed to fetch');
    }

  } catch (error) {
    console.error('✗ Verification failed:', error.message);
  }
}

// Main execution
async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Creating Test Staff Data for All Roles                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Authenticate
    await authenticate();

    // Get centres
    console.log('\n=== Fetching Centres ===');
    const centres = await getCentres();
    
    if (centres.length === 0) {
      console.error('✗ No centres found. Please create a centre first.');
      return;
    }

    const centreId = parseInt(centres[0].id);
    console.log(`✓ Using centre: ${centres[0].name} (ID: ${centreId})`);

    // Create all staff types
    await createManager(centreId);
    await createCentreManager(centreId);
    await createClinician(centreId);
    await createCareCoordinator(centreId);
    await createFrontDeskStaff(centreId);

    // Verify all staff
    await verifyStaff();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Summary                                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\nTest staff created successfully!');
    console.log('\nYou can now:');
    console.log('1. Check the Admin Panel to see all staff members');
    console.log('2. Check the Frontend to see clinicians available for booking');
    console.log('3. Login with any of the created staff credentials');
    console.log('\n📝 Save these credentials for testing:');
    console.log('   Manager: rajesh.manager / Manager@123');
    console.log('   Centre Manager: priya.centremgr / CentreMgr@123');
    console.log('   Clinician: dr.ananya / Clinician@123');
    console.log('   Care Coordinator: sneha.coordinator / Coordinator@123');
    console.log('   Front Desk: amit.frontdesk / FrontDesk@123');

  } catch (error) {
    console.error('\n✗ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
