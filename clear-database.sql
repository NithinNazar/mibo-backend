-- ============================================================================
-- CLEAR ALL DATA FROM MIBO DATABASE (ALL TABLES)
-- ============================================================================
-- This script clears all data from ALL tables while preserving:
-- - Table structures
-- - Constraints (foreign keys, unique, etc.)
-- - Indexes
-- - Functions and triggers
-- - Sequences (reset to 1)
--
-- USAGE: Run this in pgAdmin Query Tool
-- Database: mibo-development-db
-- ============================================================================

-- Step 1: Show all tables that will be cleared
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 2: Disable triggers temporarily for faster execution
SET session_replication_role = 'replica';

-- Step 3: Generate and execute TRUNCATE for all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Loop through all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Cleared table: %', r.tablename;
    END LOOP;
END $$;

-- Step 4: Re-enable triggers
SET session_replication_role = 'origin';

-- Step 5: Reset all sequences to start from 1
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Loop through all sequences
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    ) 
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' RESTART WITH 1';
        RAISE NOTICE 'Reset sequence: %', r.sequence_name;
    END LOOP;
END $$;

-- Step 6: Verify all tables are empty
SELECT 
    schemaname,
    tablename,
    (xpath('/row/cnt/text()', 
           query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I', 
                              schemaname, tablename), 
                       false, true, '')))[1]::text::int AS row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Success message
SELECT '✅ Database cleared successfully! All ' || COUNT(*) || ' tables are empty and all sequences reset.' as status
FROM pg_tables
WHERE schemaname = 'public';
