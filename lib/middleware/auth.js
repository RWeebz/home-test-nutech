/**
 * Authentication Middleware
 * Protects routes by requiring valid JWT tokens
 *
 * Usage:
 * import { authenticate } from '#lib/middleware/auth.js';
 *
 * // Protect a route
 * router.get('/protected', authenticate, (req, res) => {
 *   // req.middleware.auth will contain the auth context
 *   res.json({ message: 'Protected resource', user: req.middleware.auth.user });
 * });
 */

import { verifyToken } from '#lib/util/jwt.js';
import { unauthorized } from '#lib/api/response.js';
import logger from '#lib/util/logger.js';

/**
 * Extract token from Authorization header
 * Expects: "Authorization: Bearer <token>"
 *
 * @param {object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Check if it's a Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches decoded payload to req.middleware.auth
 *
 * If token is invalid or expired, returns 401 Unauthorized
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export function authenticate(req, res, next) {
  // Initialize middleware namespace if not exists
  if (!req.middleware) {
    req.middleware = {};
  }

  // Extract token from header
  const token = extractTokenFromHeader(req);

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return unauthorized(res, 'Token tidak tidak valid atau kadaluwarsa');
  }

  // Verify token
  const result = verifyToken(token);

  return result.match({
    ok: (payload) => {
      // Attach auth context to req.middleware.auth (namespaced to avoid conflicts)
      req.middleware.auth = {
        user: payload,
        token: token
      };

      logger.debug('Authentication successful', {
        userId: payload.userId || payload.id,
        path: req.path
      });

      next();
    },
    err: (err) => {
      logger.warn('Authentication failed: Invalid or expired token', {
        error: err.message,
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      return unauthorized(res, 'Token tidak tidak valid atau kadaluwarsa');
    }
  });
}

/**
 * Optional Authentication Middleware
 * Attaches user info if token is valid, but doesn't reject request if token is missing/invalid
 *
 * Useful for routes that have different behavior for authenticated vs anonymous users
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export function optionalAuthenticate(req, res, next) {
  // Initialize middleware namespace if not exists
  if (!req.middleware) {
    req.middleware = {};
  }

  const token = extractTokenFromHeader(req);

  if (!token) {
    // No token provided, continue as anonymous
    req.middleware.auth = null;
    return next();
  }

  // Try to verify token
  const result = verifyToken(token);

  result.match({
    ok: (payload) => {
      req.middleware.auth = {
        user: payload,
        token: token
      };
    },
    err: () => {
      // Invalid token, continue as anonymous
      req.middleware.auth = null;
    }
  });

  next();
}