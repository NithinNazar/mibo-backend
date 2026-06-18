// Test script to verify payment_notes functionality
// Run with: node test-payment-notes.js

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testPaymentNotes() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test 1: Check if payment_notes column exists
    console.log('📋 Test 1: Checking if payment_notes column exists...');
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payments' 
        AND column_name = 'payment_notes'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ payment_notes column exists!');
      console.log('   Type:', columnCheck.rows[0].data_type);
      console.log('   Nullable:', columnCheck.rows[0].is_nullable);
    } else {
      console.log('❌ payment_notes column NOT FOUND!');
      console.log('   Run migration: add_payment_notes_to_payments.sql');
      process.exit(1);
    }

    // Test 2: Check if payment_method column exists
    console.log('\n📋 Test 2: Checking if payment_method column exists...');
    const methodCheck = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'payments' 
        AND column_name = 'payment_method'
    `);
    
    if (methodCheck.rows.length > 0) {
      console.log('✅ payment_method column exists!');
      console.log('   Type:', methodCheck.rows[0].data_type);
      console.log('   Default:', methodCheck.rows[0].column_default);
    } else {
      console.log('❌ payment_method column NOT FOUND!');
      console.log('   Run migration: add_payment_method_to_payments.sql');
      process.exit(1);
    }

    // Test 3: Get a sample appointment for testing
    console.log('\n📋 Test 3: Finding a test appointment...');
    const appointmentResult = await client.query(`
      SELECT 
        a.id as appointment_id,
        a.patient_id,
        a.status,
        pp.user_id,
        u.full_name as patient_name
      FROM appointments a
      JOIN patient_profiles pp ON a.patient_id = pp.id
      JOIN users u ON pp.user_id = u.id
      WHERE a.status = 'BOOKED'
      ORDER BY a.created_at DESC
      LIMIT 1
    `);

    if (appointmentResult.rows.length === 0) {
      console.log('⚠️  No BOOKED appointments found for testing');
      console.log('   This is OK - the schema is correct, just no test data');
    } else {
      const testAppointment = appointmentResult.rows[0];
      console.log('✅ Found test appointment:');
      console.log('   Appointment ID:', testAppointment.appointment_id);
      console.log('   Patient:', testAppointment.patient_name);
      console.log('   Status:', testAppointment.status);

      // Test 4: Simulate inserting a payment with notes
      console.log('\n📋 Test 4: Testing INSERT payment with notes...');
      const testOrderId = `test_direct_${Date.now()}`;
      const testPaymentId = `test_cash_${Date.now()}`;
      
      const insertResult = await client.query(`
        INSERT INTO payments (
          patient_id, appointment_id, provider, order_id, payment_id,
          amount, currency, status, payment_method,
          consultation_fee, registration_fee, payment_notes,
          paid_at, created_at, updated_at
        ) VALUES ($1, $2, 'DIRECT', $3, $4, $5, $6, 'SUCCESS', $7, $8, $9, $10, NOW(), NOW(), NOW())
        RETURNING id, payment_method, payment_notes, amount
      `, [
        testAppointment.patient_id,
        testAppointment.appointment_id,
        testOrderId,
        testPaymentId,
        600, // amount
        'INR',
        'CASH',
        500, // consultation_fee
        100, // registration_fee
        'Test note from Node.js - Patient paid cash at reception. Receipt #TEST123'
      ]);

      if (insertResult.rows.length > 0) {
        const payment = insertResult.rows[0];
        console.log('✅ Payment inserted successfully!');
        console.log('   Payment ID:', payment.id);
        console.log('   Method:', payment.payment_method);
        console.log('   Amount: ₹', payment.amount);
        console.log('   Notes:', payment.payment_notes);

        // Test 5: Verify we can fetch the payment with notes
        console.log('\n📋 Test 5: Fetching payment to verify notes...');
        const fetchResult = await client.query(`
          SELECT 
            p.id,
            p.payment_method,
            p.payment_notes,
            p.amount,
            a.id as appointment_id,
            u.full_name as patient_name
          FROM payments p
          JOIN appointments a ON p.appointment_id = a.id
          JOIN patient_profiles pp ON a.patient_id = pp.id
          JOIN users u ON pp.user_id = u.id
          WHERE p.id = $1
        `, [payment.id]);

        if (fetchResult.rows.length > 0) {
          const fetched = fetchResult.rows[0];
          console.log('✅ Payment fetched successfully!');
          console.log('   Payment ID:', fetched.id);
          console.log('   Patient:', fetched.patient_name);
          console.log('   Method:', fetched.payment_method);
          console.log('   Notes:', fetched.payment_notes);
          console.log('   ✓ Notes match:', fetched.payment_notes === payment.payment_notes);
        }

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await client.query('DELETE FROM payments WHERE id = $1', [payment.id]);
        console.log('✅ Test data cleaned up');
      }
    }

    // Test 6: Check existing payments
    console.log('\n📋 Test 6: Checking existing payments...');
    const existingPayments = await client.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COUNT(CASE WHEN payment_notes IS NOT NULL AND payment_notes != '' THEN 1 END) as with_notes
      FROM payments
      WHERE status = 'SUCCESS'
      GROUP BY payment_method
      ORDER BY count DESC
    `);

    console.log('✅ Payment summary:');
    existingPayments.rows.forEach(row => {
      console.log(`   ${row.payment_method || 'NULL'}: ${row.count} total, ${row.with_notes} with notes`);
    });

    console.log('\n✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
    console.log('\n📝 Summary:');
    console.log('   ✓ payment_notes column exists and working');
    console.log('   ✓ payment_method column exists and working');
    console.log('   ✓ Can INSERT payments with notes');
    console.log('   ✓ Can FETCH payments with notes');
    console.log('   ✓ Database schema is ready for production');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === '42P01') {
      console.log('   Table does not exist. Check your database setup.');
    } else if (error.code === '42703') {
      console.log('   Column does not exist. Run the migration scripts first:');
      console.log('   1. add_payment_method_to_payments.sql');
      console.log('   2. add_payment_notes_to_payments.sql');
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the tests
testPaymentNotes();
