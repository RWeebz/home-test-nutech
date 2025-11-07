/**
 * Standardized API Response Utilities
 *
 * All API responses must follow this format:
 * {
 *   "status": <number>,       // Response status code (can be custom)
 *   "message": <string>,
 *   "data": <any|null>        // MANDATORY - explicitly null if no data
 * }
 *
 * Note: HTTP status code is set separately via res.status()
 */

/**
 * Creates a standardized API response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {number} status - Response status code (for JSON body)
 * @param {string} message - Human-readable message
 * @param {any} data - Response data (null if no data)
 * @returns {object} Express response
 */
function createResponse(res, statusCode, status, message, data = null) {
  return res.status(statusCode).json({
    status,
    message,
    data
  });
}

/**
 * Success response (200 OK)
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Response data (default: null)
 * @param {number} status - Response status code (default: 0 for success)
 * @returns {object} Express response
 *
 * @example
 * return success(res, 'User fetched successfully', user);
 * // HTTP 200: { status: 0, message: '...', data: user }
 *
 * @example
 * return success(res, 'Operation completed', null, 1);
 * // HTTP 200: { status: 1, message: '...', data: null }
 */
export function success(res, message, data = null, status = 0) {
  return createResponse(res, 200, status, message, data);
}

/**
 * Created response (201 Created)
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Created resource data (default: null)
 * @param {number} status - Response status code (default: 0 for success)
 * @returns {object} Express response
 *
 * @example
 * return created(res, 'User created successfully', newUser);
 * // HTTP 201: { status: 0, message: '...', data: newUser }
 */
export function created(res, message, data = null, status = 0) {
  return createResponse(res, 201, status, message, data);
}

/**
 * No Content response (204 No Content)
 * @param {object} res - Express response object
 * @returns {object} Express response
 *
 * @example
 * return noContent(res);
 */
export function noContent(res) {
  return res.status(204).end();
}

/**
 * Bad Request error (400)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {any} data - Additional error data (default: null)
 * @param {number} status - Response status code (default: 102 for bad request)
 * @returns {object} Express response
 *
 * @example
 * return badRequest(res, 'Invalid email format');
 * // HTTP 400: { status: 102, message: '...', data: null }
 */
export function badRequest(res, message, data = null, status = 102) {
  return createResponse(res, 400, status, message, data);
}

/**
 * Unauthorized error (401)
 * @param {object} res - Express response object
 * @param {string} message - Error message (default: 'Unauthorized')
 * @param {number} status - Response status code (default: 108 for unauthorized)
 * @returns {object} Express response
 *
 * @example
 * return unauthorized(res, 'Invalid credentials');
 * // HTTP 401: { status: 108, message: '...', data: null }
 */
export function unauthorized(res, message = 'Unauthorized', status = 108) {
  return createResponse(res, 401, status, message, null);
}

/**
 * Forbidden error (403)
 * @param {object} res - Express response object
 * @param {string} message - Error message (default: 'Forbidden')
 * @param {number} status - Response status code (default: 103 for forbidden)
 * @returns {object} Express response
 *
 * @example
 * return forbidden(res, 'You do not have permission to access this resource');
 * // HTTP 403: { status: 103, message: '...', data: null }
 */
export function forbidden(res, message = 'Forbidden', status = 103) {
  return createResponse(res, 403, status, message, null);
}

/**
 * Not Found error (404)
 * @param {object} res - Express response object
 * @param {string} message - Error message (default: 'Resource not found')
 * @param {number} status - Response status code (default: 104 for not found)
 * @returns {object} Express response
 *
 * @example
 * return notFound(res, 'User not found');
 * // HTTP 404: { status: 104, message: '...', data: null }
 */
export function notFound(res, message = 'Resource not found', status = 104) {
  return createResponse(res, 404, status, message, null);
}

/**
 * Conflict error (409)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {any} data - Additional error data (default: null)
 * @param {number} status - Response status code (default: 109 for conflict)
 * @returns {object} Express response
 *
 * @example
 * return conflict(res, 'Email already exists');
 * // HTTP 409: { status: 109, message: '...', data: null }
 */
export function conflict(res, message, data = null, status = 109) {
  return createResponse(res, 409, status, message, data);
}

/**
 * Internal Server Error (500)
 * @param {object} res - Express response object
 * @param {string} message - Error message (default: 'Internal server error')
 * @param {number} status - Response status code (default: 100 for server error)
 * @returns {object} Express response
 *
 * @example
 * return internalError(res, 'Database connection failed');
 * // HTTP 500: { status: 100, message: '...', data: null }
 */
export function internalError(res, message = 'Internal server error', status = 100) {
  return createResponse(res, 500, status, message, null);
}

/**
 * Generic error response with custom status codes
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {number} status - Response status code (default: 100 for error)
 * @param {any} data - Additional error data (default: null)
 * @returns {object} Express response
 *
 * @example
 * return error(res, 'Validation failed', 400, 102);
 * // HTTP 400: { status: 102, message: '...', data: null }
 *
 * @example
 * return error(res, 'Service unavailable', 503, 101);
 * // HTTP 503: { status: 101, message: '...', data: null }
 */
export function error(res, message, statusCode = 500, status = 100, data = null) {
  return createResponse(res, statusCode, status, message, data);
}

export default {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internalError,
  error
};
