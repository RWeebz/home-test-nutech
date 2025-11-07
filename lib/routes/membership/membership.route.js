/**
 * Membership Routes
 * Authentication and authorization endpoints
 */

import express from 'express';
import * as membershipController from './membership.controller.js';
import { authenticate } from '#lib/middleware/auth.js';
import { handleValidationErrors } from '#lib/middleware/validation.js';
import { validateRegistration, validateLogin, validateProfileUpdate } from './membership.validation.js';

const router = express.Router();

// Login endpoint with validation
router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  membershipController.login
);

// Registration endpoint with validation
router.post(
  '/registration',
  validateRegistration,
  handleValidationErrors,
  membershipController.register
);

// Get current user profile (requires authentication)
router.get('/profile', authenticate, membershipController.getCurrentProfile);

// Update current user profile (requires authentication)
router.put(
  '/profile/update',
  authenticate,
  validateProfileUpdate,
  handleValidationErrors,
  membershipController.updateCurrentProfile
);

// Update current user profile image (requires authentication)
router.put(
  '/profile/image',
  authenticate,
  membershipController.updateProfileImage
);

export default router;
