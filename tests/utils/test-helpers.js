/**
 * Test helper utilities for integration tests
 */

import { post } from './http-client.js';

/**
 * Generate random email for testing
 */
export function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test-${timestamp}-${random}@nutech-integrasi.com`;
}

/**
 * Generate test user data
 */
export function generateTestUser() {
  return {
    email: generateTestEmail(),
    first_name: 'Test',
    last_name: 'User',
    password: 'TestPassword123!'
  };
}

/**
 * Register and login a test user, returns token
 */
export async function createAuthenticatedUser(baseURL) {
  const user = generateTestUser();

  // Register
  const registerResponse = await post(`${baseURL}/registration`, user);

  if (registerResponse.status !== 200) {
    throw new Error(`Failed to register user: ${JSON.stringify(registerResponse.body)}`);
  }

  // Login
  const loginResponse = await post(`${baseURL}/login`, {
    email: user.email,
    password: user.password
  });

  if (loginResponse.status !== 200 || !loginResponse.body.data?.token) {
    throw new Error(`Failed to login user: ${JSON.stringify(loginResponse.body)}`);
  }

  return {
    user,
    token: loginResponse.body.data.token
  };
}

/**
 * Assert response structure matches expected format
 */
export function assertResponseFormat(response, expectedStatusCode) {
  // Log the response if it fails for debugging
  if (response.status !== expectedStatusCode) {
    console.error('Response Status:', response.status);
    console.error('Response Body:', JSON.stringify(response.body, null, 2));
  }

  expect(response.body).toHaveProperty('status');
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');
  expect(response.status).toBe(expectedStatusCode);
}

/**
 * Assert error response structure
 */
export function assertErrorResponse(response, expectedHttpStatus, expectedJSONStatus) {
  // Log the response if it fails for debugging
  if (response.status !== expectedHttpStatus || response.body.status !== expectedJSONStatus) {
    console.error('Expected HTTP Status:', expectedHttpStatus);
    console.error('Actual HTTP Status:', response.status);
    console.error('Expected Error Code:', expectedJSONStatus);
    console.error('Actual Error Code:', response.body.status);
    console.error('Response Body:', JSON.stringify(response.body, null, 2));
  }

  assertResponseFormat(response, expectedHttpStatus);
  expect(response.body.status).toBe(expectedJSONStatus);
  expect(response.body.data).toBeNull();
}

/**
 * Create authenticated request headers
 */
export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
