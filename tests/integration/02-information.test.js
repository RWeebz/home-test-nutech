/**
 * Integration Tests - Module Information
 * Tests for Get Banner, Get Services
 */

import { get } from '../utils/http-client.js';
import {
  createAuthenticatedUser,
  assertResponseFormat,
  assertErrorResponse,
  authHeaders
} from '../utils/test-helpers.js';

const baseURL = global.testConfig.baseURL;

describe('Module Information - Get Banner', () => {
  test('should successfully get banner list without authentication', async () => {
    const response = await get(`${baseURL}/banner`);

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toBe('Sukses');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('should return banners with correct structure', async () => {
    const response = await get(`${baseURL}/banner`);

    assertResponseFormat(response, 200);
    expect(Array.isArray(response.body.data)).toBe(true);

    // Check first banner structure
    if (response.body.data.length > 0) {
      const banner = response.body.data[0];
      expect(banner).toHaveProperty('banner_name');
      expect(banner).toHaveProperty('banner_image');
      expect(banner).toHaveProperty('description');
      expect(typeof banner.banner_name).toBe('string');
      expect(typeof banner.banner_image).toBe('string');
      expect(typeof banner.description).toBe('string');
    }
  });

  test('should return multiple banners', async () => {
    const response = await get(`${baseURL}/banner`);

    assertResponseFormat(response, 200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(6);
  });

  test('banner images should have valid URL format', async () => {
    const response = await get(`${baseURL}/banner`);

    assertResponseFormat(response, 200);

    response.body.data.forEach(banner => {
      expect(banner.banner_image).toMatch(/^https?:\/\/.+/);
    });
  });

  test('should be accessible without token (public endpoint)', async () => {
    const response = await get(`${baseURL}/banner`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(0);
  });
});

describe('Module Information - Get Services', () => {
  let authContext;

  beforeAll(async () => {
    authContext = await createAuthenticatedUser(baseURL);
  });

  test('should successfully get services list with valid token', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toBe('Sukses');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('should return services with correct structure', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(Array.isArray(response.body.data)).toBe(true);

    // Check first service structure
    if (response.body.data.length > 0) {
      const service = response.body.data[0];
      expect(service).toHaveProperty('service_code');
      expect(service).toHaveProperty('service_name');
      expect(service).toHaveProperty('service_icon');
      expect(service).toHaveProperty('service_tariff');
      expect(typeof service.service_code).toBe('string');
      expect(typeof service.service_name).toBe('string');
      expect(typeof service.service_icon).toBe('string');
      expect(typeof service.service_tariff).toBe('number');
      expect(service.service_tariff).toBeGreaterThanOrEqual(0);
    }
  });

  test('should return multiple services', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(12);
  });

  test('should include expected service codes', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);

    const serviceCodes = response.body.data.map(s => s.service_code);
    const expectedCodes = [
      'PAJAK',
      'PLN',
      'PDAM',
      'PULSA',
      'PGN',
      'MUSIK',
      'TV',
      'PAKET_DATA',
      'VOUCHER_GAME',
      'VOUCHER_MAKANAN',
      'QURBAN',
      'ZAKAT'
    ];

    expectedCodes.forEach(code => {
      expect(serviceCodes).toContain(code);
    });
  });

  test('service icons should have valid URL format', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);

    response.body.data.forEach(service => {
      expect(service.service_icon).toMatch(/^https?:\/\/.+/);
    });
  });

  test('should fail to get services without token', async () => {
    const response = await get(`${baseURL}/services`);

    assertErrorResponse(response, 401, 108);
    expect(response.body.message).toContain('Token tidak tidak valid atau kadaluwarsa');
  });

  test('should fail to get services with invalid token', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders('invalid_token')
    });

    assertErrorResponse(response, 401, 108);
    expect(response.body.message).toContain('Token tidak tidak valid atau kadaluwarsa');
  });

  test('should fail to get services with malformed token', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders('not.a.valid.jwt')
    });

    assertErrorResponse(response, 401, 108);
  });

  test('should fail to get services with expired token', async () => {
    // Create an expired token (this is a mock - you would need to create a token with past expiry)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiZXhwaXJlZCIsImlhdCI6MTYyNjkyODk3MSwiZXhwIjoxNjI2OTI4OTcyfQ.test';

    const response = await get(`${baseURL}/services`, {
      headers: authHeaders(expiredToken)
    });

    assertErrorResponse(response, 401, 108);
  });

  test('should validate each service has positive tariff', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);

    response.body.data.forEach(service => {
      expect(service.service_tariff).toBeGreaterThan(0);
    });
  });

  test('should validate service codes are uppercase', async () => {
    const response = await get(`${baseURL}/services`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);

    response.body.data.forEach(service => {
      expect(service.service_code).toBe(service.service_code.toUpperCase());
    });
  });
});
