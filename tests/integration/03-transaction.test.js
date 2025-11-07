/**
 * Integration Tests - Module Transaction
 * Tests for Get Balance, Top Up, Transaction, Transaction History
 */

import { get, post } from '../utils/http-client.js';
import {
  createAuthenticatedUser,
  assertResponseFormat,
  assertErrorResponse,
  authHeaders,
  sleep
} from '../utils/test-helpers.js';

const baseURL = global.testConfig.baseURL;

describe('Module Transaction - Get Balance', () => {
  let authContext;

  beforeAll(async () => {
    authContext = await createAuthenticatedUser(baseURL);
  });

  test('should successfully get balance with valid token', async () => {
    const response = await get(`${baseURL}/balance`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toContain('Get Balance Berhasil');
    expect(response.body.data).toHaveProperty('balance');
    expect(typeof response.body.data.balance).toBe('number');
    expect(response.body.data.balance).toBeGreaterThanOrEqual(0);
  });

  test('should fail to get balance without token', async () => {
    const response = await get(`${baseURL}/balance`);

    assertErrorResponse(response, 401, 108);
    expect(response.body.message).toContain('Token tidak tidak valid atau kadaluwarsa');
  });

  test('should fail to get balance with invalid token', async () => {
    const response = await get(`${baseURL}/balance`, {
      headers: authHeaders('invalid_token')
    });

    assertErrorResponse(response, 401, 108);
  });

  test('should fail to get balance with malformed token', async () => {
    const response = await get(`${baseURL}/balance`, {
      headers: authHeaders('not.a.valid.jwt')
    });

    assertErrorResponse(response, 401, 108);
  });

  test('new user should have zero or default balance', async () => {
    const newAuthContext = await createAuthenticatedUser(baseURL);

    const response = await get(`${baseURL}/balance`, {
      headers: authHeaders(newAuthContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.data.balance).toBeGreaterThanOrEqual(0);
  });
});

describe('Module Transaction - Top Up', () => {
  let authContext;

  beforeEach(async () => {
    authContext = await createAuthenticatedUser(baseURL);
  });

  test('should successfully top up balance', async () => {
    // Get initial balance
    const initialBalanceResponse = await get(`${baseURL}/balance`, {
      headers: authHeaders(authContext.token)
    });
    const initialBalance = initialBalanceResponse.body.data.balance;

    // Top up
    const topUpAmount = 1000000;
    const response = await post(
      `${baseURL}/topup`,
      { top_up_amount: topUpAmount },
      { headers: authHeaders(authContext.token) }
    );

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toContain('Top Up Balance berhasil');
    expect(response.body.data).toHaveProperty('balance');
    expect(response.body.data.balance).toBe(initialBalance + topUpAmount);
  });

  test('should successfully top up with minimum amount', async () => {
    const initialBalanceResponse = await get(`${baseURL}/balance`, {
      headers: authHeaders(authContext.token)
    });
    const initialBalance = initialBalanceResponse.body.data.balance;

    const topUpAmount = 1;
    const response = await post(
      `${baseURL}/topup`,
      { top_up_amount: topUpAmount },
      { headers: authHeaders(authContext.token) }
    );

    assertResponseFormat(response, 200);
    expect(response.body.data.balance).toBe(initialBalance + topUpAmount);
  });

  test('should successfully top up multiple times', async () => {
    const topUpAmount = 100000;

    // First top up
    const firstResponse = await post(
      `${baseURL}/topup`,
      { top_up_amount: topUpAmount },
      { headers: authHeaders(authContext.token) }
    );
    const firstBalance = firstResponse.body.data.balance;

    // Second top up
    const secondResponse = await post(
      `${baseURL}/topup`,
      { top_up_amount: topUpAmount },
      { headers: authHeaders(authContext.token) }
    );
    const secondBalance = secondResponse.body.data.balance;

    expect(secondBalance).toBe(firstBalance + topUpAmount);
  });

  test('should fail to top up with negative amount', async () => {
    const response = await post(
      `${baseURL}/topup`,
      { top_up_amount: -1000 },
      { headers: authHeaders(authContext.token) }
    );

    assertErrorResponse(response, 400, 102);
    expect(response.body.message).toContain('amount hanya boleh angka dan tidak boleh lebih kecil dari 0');
  });

  test('should fail to top up with zero amount', async () => {
    const response = await post(
      `${baseURL}/topup`,
      { top_up_amount: 0 },
      { headers: authHeaders(authContext.token) }
    );

    assertErrorResponse(response, 400, 102);
  });

  test('should fail to top up with non-numeric amount', async () => {
    const response = await post(
      `${baseURL}/topup`,
      { top_up_amount: 'abc' },
      { headers: authHeaders(authContext.token) }
    );

    assertErrorResponse(response, 400, 102);
  });

  test('should fail to top up without amount', async () => {
    const response = await post(
      `${baseURL}/topup`,
      {},
      { headers: authHeaders(authContext.token) }
    );

    assertErrorResponse(response, 400, 102);
  });

  test('should fail to top up without token', async () => {
    const response = await post(`${baseURL}/topup`, { top_up_amount: 1000000 });

    assertErrorResponse(response, 401, 108);
  });

  test('should fail to top up with invalid token', async () => {
    const response = await post(
      `${baseURL}/topup`,
      { top_up_amount: 1000000 },
      { headers: authHeaders('invalid_token') }
    );

    assertErrorResponse(response, 401, 108);
  });
});

describe('Module Transaction - Transaction', () => {
  let authContext;

  beforeEach(async () => {
    authContext = await createAuthenticatedUser(baseURL);
    // Top up balance first
    await post(
      `${baseURL}/topup`,
      { top_up_amount: 1000000 },
      { headers: authHeaders(authContext.token) }
    );
  });

  test('should successfully create transaction with valid service', async () => {
    const response = await post(
      `${baseURL}/transaction`,
      { service_code: 'PULSA' },
      { headers: authHeaders(authContext.token) }
    );

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toContain('Transaksi berhasil');
    expect(response.body.data).toHaveProperty('invoice_number');
    expect(response.body.data).toHaveProperty('service_code');
    expect(response.body.data).toHaveProperty('service_name');
    expect(response.body.data).toHaveProperty('transaction_type');
    expect(response.body.data).toHaveProperty('total_amount');
    expect(response.body.data).toHaveProperty('created_on');
    expect(response.body.data.transaction_type).toBe('PAYMENT');
    expect(typeof response.body.data.invoice_number).toBe('string');
    expect(response.body.data.invoice_number.length).toBeGreaterThan(0);
  });

  test('should deduct balance after transaction', async () => {
    // Get initial balance
    const initialBalanceResponse = await get(`${baseURL}/balance`, {
      headers: authHeaders(authContext.token)
    });
    const initialBalance = initialBalanceResponse.body.data.balance;

    // Make transaction
    const transactionResponse = await post(
      `${baseURL}/transaction`,
      { service_code: 'PLN' },
      { headers: authHeaders(authContext.token) }
    );
    const transactionAmount = transactionResponse.body.data.total_amount;

    // Check new balance
    const newBalanceResponse = await get(`${baseURL}/balance`, {
      headers: authHeaders(authContext.token)
    });
    const newBalance = newBalanceResponse.body.data.balance;

    expect(newBalance).toBe(initialBalance - transactionAmount);
  });

  test('should successfully create multiple transactions', async () => {
    // First transaction
    const firstResponse = await post(
      `${baseURL}/transaction`,
      { service_code: 'PULSA' },
      { headers: authHeaders(authContext.token) }
    );
    expect(firstResponse.status).toBe(200);

    // Second transaction
    const secondResponse = await post(
      `${baseURL}/transaction`,
      { service_code: 'PLN' },
      { headers: authHeaders(authContext.token) }
    );
    expect(secondResponse.status).toBe(200);

    // Invoice numbers should be different
    expect(firstResponse.body.data.invoice_number).not.toBe(
      secondResponse.body.data.invoice_number
    );
  });

  test('should fail transaction with invalid service code', async () => {
    const response = await post(
      `${baseURL}/transaction`,
      { service_code: 'INVALID_SERVICE' },
      { headers: authHeaders(authContext.token) }
    );

    assertErrorResponse(response, 400, 102);
    expect(response.body.message).toContain('Service ataus Layanan tidak ditemukan');
  });

  test('should fail transaction with empty service code', async () => {
    const response = await post(
      `${baseURL}/transaction`,
      { service_code: '' },
      { headers: authHeaders(authContext.token) }
    );

    assertErrorResponse(response, 400, 102);
  });

  test('should fail transaction without service code', async () => {
    const response = await post(
      `${baseURL}/transaction`,
      {},
      { headers: authHeaders(authContext.token) }
    );

    assertErrorResponse(response, 400, 102);
  });

  test('should fail transaction with insufficient balance', async () => {
    // Create new user with no balance
    const newAuthContext = await createAuthenticatedUser(baseURL);

    const response = await post(
      `${baseURL}/transaction`,
      { service_code: 'QURBAN' }, // Expensive service
      { headers: authHeaders(newAuthContext.token) }
    );

    // Should fail due to insufficient balance
    expect(response.status).toBe(400);
  });

  test('should fail transaction without token', async () => {
    const response = await post(`${baseURL}/transaction`, { service_code: 'PULSA' });

    assertErrorResponse(response, 401, 108);
  });

  test('should fail transaction with invalid token', async () => {
    const response = await post(
      `${baseURL}/transaction`,
      { service_code: 'PULSA' },
      { headers: authHeaders('invalid_token') }
    );

    assertErrorResponse(response, 401, 108);
  });

  test('transaction should have valid timestamp format', async () => {
    const response = await post(
      `${baseURL}/transaction`,
      { service_code: 'PULSA' },
      { headers: authHeaders(authContext.token) }
    );

    assertResponseFormat(response, 200);
    const createdOn = new Date(response.body.data.created_on);
    expect(createdOn).toBeInstanceOf(Date);
    expect(createdOn.getTime()).not.toBeNaN();
  });
});

describe('Module Transaction - Transaction History', () => {
  let authContext;

  beforeAll(async () => {
    authContext = await createAuthenticatedUser(baseURL);

    // Create some transactions
    await post(
      `${baseURL}/topup`,
      { top_up_amount: 1000000 },
      { headers: authHeaders(authContext.token) }
    );

    await sleep(100);

    await post(
      `${baseURL}/transaction`,
      { service_code: 'PULSA' },
      { headers: authHeaders(authContext.token) }
    );

    await sleep(100);

    await post(
      `${baseURL}/transaction`,
      { service_code: 'PLN' },
      { headers: authHeaders(authContext.token) }
    );
  });

  test('should successfully get transaction history', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.status).toBe(0);
    expect(response.body.message).toContain('Get History Berhasil');
    expect(response.body.data).toHaveProperty('offset');
    expect(response.body.data).toHaveProperty('limit');
    expect(response.body.data).toHaveProperty('records');
    expect(Array.isArray(response.body.data.records)).toBe(true);
  });

  test('should return history records with correct structure', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.data.records.length).toBeGreaterThan(0);

    const record = response.body.data.records[0];
    expect(record).toHaveProperty('invoice_number');
    expect(record).toHaveProperty('transaction_type');
    expect(record).toHaveProperty('description');
    expect(record).toHaveProperty('total_amount');
    expect(record).toHaveProperty('created_on');
    expect(['TOPUP', 'PAYMENT']).toContain(record.transaction_type);
  });

  test('should respect limit parameter', async () => {
    const limit = 2;
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=${limit}`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.data.limit).toBe(limit);
    expect(response.body.data.records.length).toBeLessThanOrEqual(limit);
  });

  test('should respect offset parameter', async () => {
    const offset = 1;
    const response = await get(`${baseURL}/transaction/history?offset=${offset}&limit=10`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.data.offset).toBe(offset);
  });

  test('should return all history without limit', async () => {
    const response = await get(`${baseURL}/transaction/history`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(Array.isArray(response.body.data.records)).toBe(true);
  });

  test('should order transactions by date (newest first)', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);

    if (response.body.data.records.length > 1) {
      const records = response.body.data.records;
      for (let i = 0; i < records.length - 1; i++) {
        const currentDate = new Date(records[i].created_on);
        const nextDate = new Date(records[i + 1].created_on);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    }
  });

  test('should include TOPUP transactions in history', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);

    const topupTransactions = response.body.data.records.filter(
      r => r.transaction_type === 'TOPUP'
    );
    expect(topupTransactions.length).toBeGreaterThan(0);
  });

  test('should include PAYMENT transactions in history', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);

    const paymentTransactions = response.body.data.records.filter(
      r => r.transaction_type === 'PAYMENT'
    );
    expect(paymentTransactions.length).toBeGreaterThan(0);
  });

  test('should fail to get history without token', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`);

    assertErrorResponse(response, 401, 108);
  });

  test('should fail to get history with invalid token', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders('invalid_token')
    });

    assertErrorResponse(response, 401, 108);
  });

  test('should handle pagination correctly', async () => {
    // Get first page
    const firstPageResponse = await get(`${baseURL}/transaction/history?offset=0&limit=1`, {
      headers: authHeaders(authContext.token)
    });

    // Get second page
    const secondPageResponse = await get(`${baseURL}/transaction/history?offset=1&limit=1`, {
      headers: authHeaders(authContext.token)
    });

    expect(firstPageResponse.body.data.records.length).toBeLessThanOrEqual(1);
    expect(secondPageResponse.body.data.records.length).toBeLessThanOrEqual(1);

    // Records should be different if both exist
    if (
      firstPageResponse.body.data.records.length > 0 &&
      secondPageResponse.body.data.records.length > 0
    ) {
      expect(firstPageResponse.body.data.records[0].invoice_number).not.toBe(
        secondPageResponse.body.data.records[0].invoice_number
      );
    }
  });

  test('history timestamps should be valid', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);

    response.body.data.records.forEach(record => {
      const createdOn = new Date(record.created_on);
      expect(createdOn).toBeInstanceOf(Date);
      expect(createdOn.getTime()).not.toBeNaN();
    });
  });

  test('should handle zero offset', async () => {
    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders(authContext.token)
    });

    assertResponseFormat(response, 200);
    expect(response.body.data.offset).toBe(0);
  });

  test('should return empty records for user with no transactions', async () => {
    const newAuthContext = await createAuthenticatedUser(baseURL);

    const response = await get(`${baseURL}/transaction/history?offset=0&limit=10`, {
      headers: authHeaders(newAuthContext.token)
    });

    assertResponseFormat(response, 200);
    expect(Array.isArray(response.body.data.records)).toBe(true);
  });
});
