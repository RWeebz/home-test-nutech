/**
 * HTTP Client utility for integration tests
 * Provides a simple interface for making HTTP requests
 */

import fetch from 'node-fetch';

/**
 * Make HTTP request
 * @param {string} url - Request URL
 * @param {object} options - Request options
 * @returns {Promise<{status: number, body: object, headers: object}>}
 */
export async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  let body;
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    status: response.status,
    body,
    headers: Object.fromEntries(response.headers.entries())
  };
}

/**
 * Make GET request
 */
export async function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' });
}

/**
 * Make POST request
 */
export async function post(url, body, options = {}) {
  return request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * Make PUT request
 */
export async function put(url, body, options = {}) {
  return request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

/**
 * Make DELETE request
 */
export async function del(url, options = {}) {
  return request(url, { ...options, method: 'DELETE' });
}

/**
 * Create authenticated request headers
 */
export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}
