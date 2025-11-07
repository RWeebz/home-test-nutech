/**
 * Validation Middleware
 * Handles express-validator validation errors
 */

import { validationResult } from 'express-validator';
import { badRequest } from '#lib/api/response.js';

/**
 * Middleware to handle validation errors from express-validator
 * Call this after validation rules to check if validation passed
 *
 * Usage:
 * ```js
 * import { body } from 'express-validator';
 * import { handleValidationErrors } from '#lib/middleware/validation.js';
 *
 * router.post('/endpoint',
 *   body('email').isEmail(),
 *   body('name').notEmpty(),
 *   handleValidationErrors,  // Check validation results
 *   controller
 * );
 * ```
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Get the first error message
    const firstError = errors.array()[0];
    return badRequest(res, firstError.msg, null, 102);
  }

  next();
}
