const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        connectionString: 'postgresql://postgres:g20m340i@localhost:5432/mibo-development-db'
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const migrationPath = path.join(__dirname, 'migrations', 'add_clinician_session_tracking.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running migration: add_clinician_session_tracking.sql');
        await client.query(sql);
        console.log('✅ Migration completed successfully');

        // Verify the migration
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' 
            AND column_name IN ('session_started_at', 'session_ended_at', 'patient_notes');
        `);
        console.log('\n✅ Verification - Appointments table columns:');
        console.table(result.rows);

        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('clinician_notes_history', 'follow_up_appointments')
            AND table_schema = 'public';
        `);
        console.log('✅ Verification - New tables:');
        console.table(tablesResult.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
