// Jest setup file for backend tests
// This file runs before each test suite

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['REFRESH_TOKEN_SECRET'] = 'test-refresh-secret';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/stockmeter_test';

// Mock console methods in test environment
if (process.env['NODE_ENV'] === 'test') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}