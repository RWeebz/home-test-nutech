/**
 * Information Routes
 * Banner and services information endpoints
 */

import express from 'express';
import * as informationController from './information.controller.js';
import { authenticate } from '#lib/middleware/auth.js';

const router = express.Router();

// Get all banners (public access)
router.get('/banner', informationController.getBanners);

// Get all services (requires authentication)
router.get('/services', authenticate, informationController.getServices);

export default router;
