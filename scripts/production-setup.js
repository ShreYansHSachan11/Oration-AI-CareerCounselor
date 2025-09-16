#!/usr/bin/env node

/**
 * Production Setup Script
 * Handles database migrations, health checks, and initial setup for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  maxRetries: 30,
  retryDelay: 2000,
  healthCheckUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
};

// Logging utility
const log = {
  info: msg => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: msg => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  warn: msg => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
};

// Wait for database to be ready
async function waitForDatabase() {
  log.info('Waiting for database connection...');

  for (let i = 0; i < config.maxRetries; i++) {
    try {
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'pipe',
        timeout: 10000,
      });
      log.info('Database connection established');
      return true;
    } catch (error) {
      log.warn(
        `Database connection attempt ${i + 1}/${config.maxRetries} failed`
      );
      if (i === config.maxRetries - 1) {
        log.error('Failed to connect to database after maximum retries');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    }
  }
}

// Run database migrations
async function runMigrations() {
  log.info('Running database migrations...');

  try {
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    log.info('Prisma client generated successfully');

    // Deploy migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    log.info('Database migrations completed successfully');

    // Seed database if needed
    if (process.env.SEED_DATABASE === 'true') {
      log.info('Seeding database...');
      execSync('npx prisma db seed', { stdio: 'inherit' });
      log.info('Database seeding completed');
    }
  } catch (error) {
    log.error('Migration failed:', error.message);
    throw error;
  }
}

// Validate environment variables
function validateEnvironment() {
  log.info('Validating environment variables...');

  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'OPENAI_API_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Validate database URL format
  if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
    log.error('DATABASE_URL must be a PostgreSQL connection string');
    process.exit(1);
  }

  // Validate NextAuth secret length
  if (process.env.NEXTAUTH_SECRET.length < 32) {
    log.error('NEXTAUTH_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  log.info('Environment validation passed');
}

// Health check
async function healthCheck() {
  log.info('Performing application health check...');

  try {
    const response = await fetch(`${config.healthCheckUrl}/api/health`);
    if (response.ok) {
      log.info('Application health check passed');
      return true;
    } else {
      log.error(`Health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error('Health check failed:', error.message);
    return false;
  }
}

// Create necessary directories
function createDirectories() {
  log.info('Creating necessary directories...');

  const dirs = ['logs', 'uploads', 'tmp'];

  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.info(`Created directory: ${dir}`);
    }
  });
}

// Main setup function
async function main() {
  try {
    log.info('Starting production setup...');

    // Validate environment
    validateEnvironment();

    // Create directories
    createDirectories();

    // Wait for database
    await waitForDatabase();

    // Run migrations
    await runMigrations();

    log.info('Production setup completed successfully');

    // If this is a health check run, perform it
    if (process.argv.includes('--health-check')) {
      const isHealthy = await healthCheck();
      process.exit(isHealthy ? 0 : 1);
    }
  } catch (error) {
    log.error('Production setup failed:', error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => {
  log.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, healthCheck, validateEnvironment };
