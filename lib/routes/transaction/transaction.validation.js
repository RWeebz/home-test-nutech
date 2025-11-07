import { body, query } from 'express-validator';

/**
 * Validation rules for top up endpoint
 */
export const validateTopUp = [
  body('top_up_amount')
    .notEmpty()
    .withMessage('Top up amount is required')
    .isInt({ min: 0 })
    .withMessage('Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0');
      }
      return true;
    })
];

/**
 * Validation rules for transaction endpoint
 */
export const validateTransaction = [
  body('service_code')
    .trim()
    .notEmpty()
    .withMessage('Service code is required')
    .isString()
    .withMessage('Service code must be a string')
];

/**
 * Validation rules for transaction history query parameters
 */
export const validateTransactionHistory = [
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer')
    .toInt()
];
