/**
 * Membership Validation Rules
 * Uses express-validator for request payload validation
 * Also includes multer configuration for file uploads
 */

import { body } from 'express-validator';
import multer from 'multer';

/**
 * Validation rules for user registration
 *
 * Payload structure:
 * {
 *   email: string (valid email format),
 *   first_name: string (3-50 chars),
 *   last_name: string (3-50 chars),
 *   password: string (8-20 chars, min 1 uppercase, min 1 symbol)
 * }
 */
export const validateRegistration = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Paramter email tidak sesuai format')
    .normalizeEmail(),

  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('First name must be between 3 and 50 characters')
    .isString()
    .withMessage('First name must be a string'),

  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Last name must be between 3 and 50 characters')
    .isString()
    .withMessage('Last name must be a string'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must be between 8 and 20 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one symbol'),
];

/**
 * Validation rules for user login
 *
 * Payload structure:
 * {
 *   email: string (valid email format),
 *   password: string
 * }
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Paramter email tidak sesuai format')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for profile update
 *
 * Payload structure:
 * {
 *   first_name: string (3-50 chars),
 *   last_name: string (3-50 chars)
 * }
 */
export const validateProfileUpdate = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('First name must be between 3 and 50 characters')
    .isString()
    .withMessage('First name must be a string'),

  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Last name must be between 3 and 50 characters')
    .isString()
    .withMessage('Last name must be a string'),
];
