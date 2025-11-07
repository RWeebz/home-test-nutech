import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import expressWinston from 'express-winston';
import logger from '#lib/util/logger.js';
import { createAppState } from '#lib/util/state.js';
// Note: optionalAuthenticate available but not used in app.js
// import { optionalAuthenticate } from '#lib/middleware/auth.js';

import router from '#lib/routes/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize and configure the Express application
 * This is an async function because it needs to:
 * - Initialize database connection and test it
 * - Set up S3 client
 * - Create application state
 *
 * @returns {Promise<Express>} Configured Express app
 */
export async function initializeApp() {
  const app = express();

  // Initialize application state and make it accessible via app.locals
  // This will test database connection and throw if it fails
  app.locals.state = await createAppState();

  // Winston HTTP request logging
  app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: false,
    colorize: true,
    ignoreRoute: function (_req, _res) { return false; }
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(router);

  /**
   * 404 Error Handler - catch requests to non-existent routes
   */
  app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
  });

  /**
   * Global Error Handler Middleware
   * This catches all errors that occur in route handlers and middleware
   */
  app.use((err, req, res, _next) => {
    // Default to 500 if status not set
    const status = err.status || err.statusCode || 500;

    // Log the error (full details in logs)
    logger.error('Express error handler caught an error', {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        status
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body
      }
    });

    // Send generic error response (no sensitive details)
    res.status(status).json({
      error: {
        message: 'Internal server error',
        status
      }
    });
  });

  return app;
}
