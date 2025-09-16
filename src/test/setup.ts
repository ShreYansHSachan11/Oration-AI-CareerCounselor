import { beforeAll, afterAll, vi } from 'vitest';
import '@testing-library/jest-dom';

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  if (!process.env.NODE_ENV) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
    });
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  }
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'test-secret';
  }
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
  if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'test-openai-key';
  }

  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(async () => {
  // Cleanup after all tests
  vi.restoreAllMocks();
});
