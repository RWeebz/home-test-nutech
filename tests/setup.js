import { config } from 'dotenv';

// Load environment variables
config( {
    path: './.env.test'
});

// Global test configuration
global.testConfig = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000
};
