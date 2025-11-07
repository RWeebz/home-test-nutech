/**
 * Information Controller Layer
 * Handles banner and services HTTP requests
 * Manages database connections and error handling using catchError pattern
 */

import { catchError, catchErrorSync } from '#lib/util/result.js';
import { success, error } from '#lib/api/response.js';
import * as informationService from './information.service.js';
import * as informationDTO from './information.dto.js';
import logger from '#lib/util/logger.js';

/**
 * Get all banners
 * GET /banner
 *
 * Public access - no authentication required
 */
export async function getBanners(req, res) {
  const { db_conn } = req.app.locals.state;

  // Use connection pool for read operation (no transaction needed)
  const [err, banners] = await catchError(informationService.getAllBanners(db_conn));

  if (err) {
    logger.error('Failed to fetch banners', {
      error: err.message,
      stack: err.stack
    });
    return error(res, 'Internal server error', 500);
  }

  // Transform to DTO with error handling
  const [dtoErr, bannersResponse] = catchErrorSync(() =>
    banners.map(banner => informationDTO.toBannerDTO(banner))
  );

  if (dtoErr) {
    logger.error('Failed to transform banners to DTO', {
      error: dtoErr.message,
      stack: dtoErr.stack
    });
    return error(res, 'Internal server error', 500);
  }

  return success(res, 'Sukses', bannersResponse);
}

/**
 * Get all services
 * GET /services
 *
 * Requires authentication (req.middleware.auth populated by middleware)
 */
export async function getServices(req, res) {
  const { db_conn } = req.app.locals.state;

  // Use connection pool for read operation (no transaction needed)
  const [err, services] = await catchError(informationService.getAllServices(db_conn));

  if (err) {
    logger.error('Failed to fetch services', {
      error: err.message,
      stack: err.stack
    });
    return error(res, 'Internal server error', 500);
  }

  // Transform to DTO with error handling
  const [dtoErr, servicesResponse] = catchErrorSync(() =>
    services.map(service => informationDTO.toServiceDTO(service))
  );

  if (dtoErr) {
    logger.error('Failed to transform services to DTO', {
      error: dtoErr.message,
      stack: dtoErr.stack
    });
    return error(res, 'Internal server error', 500);
  }

  return success(res, 'Sukses', servicesResponse);
}
