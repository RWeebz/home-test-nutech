/**
 * Integration Tests - Module Membership
 * Tests for Registration, Login, Get Profile, Update Profile, Upload Profile Image
 */

import { get, post, put } from '../utils/http-client.js';
import {
  generateTestUser,
  createAuthenticatedUser,
  assertResponseFormat,
  assertErrorResponse,
  authHeaders
} from '../utils/test-helpers.js';

const baseURL = global.testConfig.baseURL;

describe('Module Membership - Registration', () => {
  test('should successfully register a new user', async () => {
    const user = generateTestUser();

    const response = await post(`${baseURL}/registration`, user);

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toContain('Registrasi berhasil');
    expect(response.body.data).toBeNull();
  });

  test('should fail registration with invalid email format', async () => {
    const user = generateTestUser();
    user.email = 'invalid-email';

    const response = await post(`${baseURL}/registration`, user);

    assertErrorResponse(response, 400, 102);
    expect(response.body.message).toContain('email tidak sesuai format');
  });

  test('should fail registration with password less than 8 characters', async () => {
    const user = generateTestUser();
    user.password = 'short';

    const response = await post(`${baseURL}/registration`, user);

    assertErrorResponse(response, 400, 102);
  });

  test('should fail registration with missing email', async () => {
    const user = generateTestUser();
    delete user.email;

    const response = await post(`${baseURL}/registration`, user);

    assertErrorResponse(response, 400, 102);
  });

  test('should fail registration with missing first_name', async () => {
    const user = generateTestUser();
    delete user.first_name;

    const response = await post(`${baseURL}/registration`, user);

    assertErrorResponse(response, 400, 102);
  });

  test('should fail registration with missing last_name', async () => {
    const user = generateTestUser();
    delete user.last_name;

    const response = await post(`${baseURL}/registration`, user);

    assertErrorResponse(response, 400, 102);
  });

  test('should fail registration with duplicate email', async () => {
    const user = generateTestUser();

    // Register first time
    await post(`${baseURL}/registration`, user);

    // Try to register again with same email
    const response = await post(`${baseURL}/registration`, user);

    assertErrorResponse(response, 400, 102);
  });
});

describe('Module Membership - Login', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user for login tests
    testUser = generateTestUser();
    await post(`${baseURL}/registration`, testUser);
  });

  test('should successfully login with correct credentials', async () => {
    const response = await post(`${baseURL}/login`, {
      email: testUser.email,
      password: testUser.password
    });

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toContain('Login');
    expect(response.body.data).toHaveProperty('token');
    expect(typeof response.body.data.token).toBe('string');
    expect(response.body.data.token.length).toBeGreaterThan(0);
  });

  test('should fail login with invalid email format', async () => {
    const response = await post(`${baseURL}/login`, {
      email: 'invalid-email',
      password: testUser.password
    });

    assertErrorResponse(response, 400, 102);
    expect(response.body.message).toContain('email tidak sesuai format');
  });

  test('should fail login with wrong password', async () => {
    const response = await post(`${baseURL}/login`, {
      email: testUser.email,
      password: 'wrongpassword123'
    });

    assertErrorResponse(response, 401, 103);
    expect(response.body.message).toContain('Username atau password salah');
  });

  test('should fail login with non-existent email', async () => {
    const response = await post(`${baseURL}/login`, {
      email: 'nonexistent@nutech-integrasi.com',
      password: 'password123'
    });

    assertErrorResponse(response, 401, 103);
  });

  test('should fail login with missing email', async () => {
    const response = await post(`${baseURL}/login`, {
      password: testUser.password
    });

    assertErrorResponse(response, 400, 102);
  });

  test('should fail login with missing password', async () => {
    const response = await post(`${baseURL}/login`, {
      email: testUser.email
    });

    assertErrorResponse(response, 400, 102);
  });
});

describe('Module Membership - Get Profile', () => {
  let authContext;

  beforeAll(async () => {
    authContext = await createAuthenticatedUser(baseURL);
  });

  test('should successfully get profile with valid token', async () => {
    const response = await get(`${baseURL}/profile`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toBe('Sukses');
    expect(response.body.data).toHaveProperty('email');
    expect(response.body.data).toHaveProperty('first_name');
    expect(response.body.data).toHaveProperty('last_name');
    expect(response.body.data).toHaveProperty('profile_image');
    expect(response.body.data.email).toBe(authContext.user.email);
    expect(response.body.data.first_name).toBe(authContext.user.first_name);
    expect(response.body.data.last_name).toBe(authContext.user.last_name);
  });

  test('should fail to get profile with invalid token', async () => {
    const response = await get(`${baseURL}/profile`, {
      headers: authHeaders('invalid_token')
    });

    assertErrorResponse(response, 401, 108);
    expect(response.body.message).toContain('Token tidak tidak valid atau kadaluwarsa');
  });

  test('should fail to get profile without token', async () => {
    const response = await get(`${baseURL}/profile`);

    assertErrorResponse(response, 401, 108);
  });

  test('should fail to get profile with malformed token', async () => {
    const response = await get(`${baseURL}/profile`, {
      headers: authHeaders('not.a.valid.jwt')
    });

    assertErrorResponse(response, 401, 108);
  });
});

describe('Module Membership - Update Profile', () => {
  let authContext;

  beforeEach(async () => {
    authContext = await createAuthenticatedUser(baseURL);
  });

  test('should successfully update profile with both first_name and last_name', async () => {
    const updateData = {
      first_name: 'User Edited',
      last_name: 'Nutech Edited'
    };

    const response = await put(`${baseURL}/profile/update`, updateData, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toContain('Update Pofile berhasil');
    expect(response.body.data).toHaveProperty('email');
    expect(response.body.data).toHaveProperty('first_name');
    expect(response.body.data).toHaveProperty('last_name');
    expect(response.body.data).toHaveProperty('profile_image');
    expect(response.body.data.email).toBe(authContext.user.email);
    expect(response.body.data.first_name).toBe(updateData.first_name);
    expect(response.body.data.last_name).toBe(updateData.last_name);
  });

  test('should fail to update profile without token', async () => {
    const updateData = {
      first_name: 'User Edited',
      last_name: 'Nutech Edited'
    };

    const response = await put(`${baseURL}/profile/update`, updateData);

    assertErrorResponse(response, 401, 108);
  });

  test('should fail to update profile with invalid token', async () => {
    const updateData = {
      first_name: 'User Edited',
      last_name: 'Nutech Edited'
    };

    const response = await put(`${baseURL}/profile/update`, updateData, {
      headers: authHeaders('invalid_token')
    });

    assertErrorResponse(response, 401, 108);
  });

  test('should fail with missing first_name', async () => {
    const updateData = {
      last_name: 'Nutech Edited'
    };

    const response = await put(`${baseURL}/profile/update`, updateData, {
      headers: authHeaders(authContext.token)
    });

    assertErrorResponse(response, 400, 102);
  });

  test('should fail with missing last_name', async () => {
    const updateData = {
      first_name: 'User Edited'
    };

    const response = await put(`${baseURL}/profile/update`, updateData, {
      headers: authHeaders(authContext.token)
    });

    assertErrorResponse(response, 400, 102);
  });

  test('should fail with empty first_name', async () => {
    const updateData = {
      first_name: '',
      last_name: 'Nutech Edited'
    };

    const response = await put(`${baseURL}/profile/update`, updateData, {
      headers: authHeaders(authContext.token)
    });

    assertErrorResponse(response, 400, 102);
  });

  test('should fail with empty last_name', async () => {
    const updateData = {
      first_name: 'User Edited',
      last_name: ''
    };

    const response = await put(`${baseURL}/profile/update`, updateData, {
      headers: authHeaders(authContext.token)
    });

    assertErrorResponse(response, 400, 102);
  });
});

describe('Module Membership - Upload Profile Image', () => {
  let authContext;

  beforeEach(async () => {
    authContext = await createAuthenticatedUser(baseURL);
  });

  test('should fail without token', async () => {
    const formData = new FormData();
    // Create a mock image file
    const blob = new Blob(['mock image data'], { type: 'image/jpeg' });
    formData.append('file', blob, 'profile.jpg');

    const response = await fetch(`${baseURL}/profile/image`, {
      method: 'PUT',
      body: formData
    });

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe(108);
  });

  test('should fail with invalid token', async () => {
    const formData = new FormData();
    const blob = new Blob(['mock image data'], { type: 'image/jpeg' });
    formData.append('file', blob, 'profile.jpg');

    const response = await fetch(`${baseURL}/profile/image`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer invalid_token'
      },
      body: formData
    });

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe(108);
  });

  test('should fail with invalid file format (non-image)', async () => {
    const formData = new FormData();
    const blob = new Blob(['mock text data'], { type: 'text/plain' });
    formData.append('file', blob, 'document.txt');

    const response = await fetch(`${baseURL}/profile/image`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authContext.token}`
      },
      body: formData
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe(102);
    expect(body.message).toContain('Format Image tidak sesuai');
  });

  test('should fail without file', async () => {
    const formData = new FormData();

    const response = await fetch(`${baseURL}/profile/image`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authContext.token}`
      },
      body: formData
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe(102);
  });
});
