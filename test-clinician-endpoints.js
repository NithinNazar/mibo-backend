const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// This is a test script to verify the new clinician dashboard endpoints
// You'll need a valid clinician JWT token to run these tests

async function testEndpoints() {
    console.log('🧪 Testing Clinician Dashboard Endpoints\n');

    // You need to get a real token by logging in as a clinician
    const token = 'YOUR_CLINICIAN_JWT_TOKEN_HERE';

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const today = new Date().toISOString().split('T')[0];

    try {
        // Test 1: Get dashboard stats
        console.log('1️⃣  Testing GET /appointments/dashboard/stats');
        try {
            const statsResponse = await axios.get(`${BASE_URL}/appointments/dashboard/stats`, {
                headers,
                params: { startDate: today, endDate: today }
            });
            console.log('   ✅ Status:', statsResponse.status);
            console.log('   📊 Stats:', statsResponse.data.data);
        } catch (error) {
            console.log('   ❌ Error:', error.response?.status, error.response?.data?.message || error.message);
        }
        console.log('');

        // Test 2: Get dashboard appointments
        console.log('2️⃣  Testing GET /appointments/dashboard/appointments');
        try {
            const appointmentsResponse = await axios.get(`${BASE_URL}/appointments/dashboard/appointments`, {
                headers,
                params: { startDate: today, endDate: today }
            });
            console.log('   ✅ Status:', appointmentsResponse.status);
            console.log('   📅 Appointments count:', appointmentsResponse.data.data?.length || 0);
            if (appointmentsResponse.data.data?.[0]) {
                console.log('   📄 Sample appointment:', {
                    id: appointmentsResponse.data.data[0].id,
                    patient_name: appointmentsResponse.data.data[0].patient_name,
                    status: appointmentsResponse.data.data[0].status,
                });
            }
        } catch (error) {
            console.log('   ❌ Error:', error.response?.status, error.response?.data?.message || error.message);
        }
        console.log('');

        // Test 3: Verify route registration (without authentication)
        console.log('3️⃣  Verifying route registration (should return 401 Unauthorized)');
        const routes = [
            '/appointments/dashboard/stats',
            '/appointments/dashboard/appointments',
            '/appointments/123/start-session',
            '/appointments/123/end-session',
            '/appointments/123/clinician-notes',
            '/appointments/123/previous-notes',
            '/appointments/123/schedule-followup',
        ];

        for (const route of routes) {
            try {
                const method = route.includes('/start-session') || 
                               route.includes('/end-session') || 
                               route.includes('/clinician-notes') ||
                               route.includes('/schedule-followup') ? 'post' : 'get';
                
                await axios[method](`${BASE_URL}${route}`);
                console.log(`   ⚠️  ${route} - No auth required (unexpected)`);
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log(`   ✅ ${route} - Auth required (expected)`);
                } else if (error.response?.status === 404) {
                    console.log(`   ❌ ${route} - Route not found!`);
                } else {
                    console.log(`   ⚠️  ${route} - Unexpected error:`, error.response?.status);
                }
            }
        }

        console.log('\n✅ Endpoint testing complete!');
        console.log('\n📝 To fully test the authenticated endpoints:');
        console.log('   1. Login as a clinician via the admin panel');
        console.log('   2. Copy the JWT token from browser developer tools (Application > Local Storage)');
        console.log('   3. Replace YOUR_CLINICIAN_JWT_TOKEN_HERE in this file');
        console.log('   4. Run this script again\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEndpoints();
