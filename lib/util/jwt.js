/**
 * JWT Utilities
 * Handles JWT token generation and validation
 *
 * Token Structure:
 * - Access Token: 12 hours, used for API requests
 * - Uses jsonwebtoken package with HMAC-SHA256
 */

import jwt from 'jsonwebtoken';
import { Result } from '#lib/util/result.js';

/**
 * Get JWT secret from environment
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
}

/**
 * Generate JWT access token
 *
 * @param {object} payload - User data to encode { userId, email, etc. }
 * @param {object} options - Token options
 * @param {number} options.expiresIn - Token expiration in seconds (default: 43200 = 12 hours)
 * @returns {Result} Result containing JWT token string or error
 *
 * @example
 * const result = generateToken({ userId: 123, email: 'user@example.com' });
 * result.match({
 *   ok: (token) => console.log('Token:', token),
 *   err: (error) => console.error('Error:', error.message)
 * });
 */
export function generateToken(payload, options = {}) {
  try {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be an object');
    }

    const secret = getJwtSecret();
    const expiresIn = options.expiresIn || 43200; // 12 hours

    // Sign token with expiration (synchronous)
    const token = jwt.sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn: expiresIn
    });

    return Result.ok(token);
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Verify and decode JWT token
 * Validates signature and checks if token is expired
 *
 * @param {string} token - JWT token to verify
 * @returns {Result} Result containing decoded payload or error
 *
 * @example
 * const result = verifyToken(token);
 * result.match({
 *   ok: (payload) => console.log('User:', payload.userId),
 *   err: (error) => console.error('Invalid token:', error.message)
 * });
 */
export function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Token is required and must be a string');
    }

    const secret = getJwtSecret();

    // Verify token (throws if invalid or expired)
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256']
    });

    return Result.ok(payload);
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error(String(error)));
  }
}