-- Production Database Initialization Script
-- This script sets up the production database with proper configurations

-- Create database if it doesn't exist (handled by Docker)
-- CREATE DATABASE IF NOT EXISTS career_counseling_chat;

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create indexes for performance (these will be created by Prisma migrations)
-- But we can add additional performance indexes here if needed

-- Set up connection limits and timeouts
ALTER SYSTEM SET max_connections = '100';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Production database initialized successfully at %', now();
END $$;