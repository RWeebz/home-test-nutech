/**
 * Application State Management
 *
 * This module creates and manages the global application state/context
 * that can be injected into controllers and services.
 *
 * ## Usage in Controllers
 *
 * The application state is stored in `app.locals.state` and can be accessed
 * in any route handler or middleware via `req.app.locals.state`.
 *
 * ### Example 1: Basic Access
 * ```javascript
 * export async function getUserController(req, res) {
 *   // Access the entire state object
 *   const state = req.app.locals.state;
 *
 *   // Use logger from state
 *   state.logger.info('Fetching user', { userId: req.params.id });
 *
 *   // Continue with your logic...
 * }
 * ```
 *
 * ### Example 2: Destructuring for Cleaner Code
 * ```javascript
 * export async function createUserController(req, res) {
 *   // Destructure what you need from state
 *   const { logger, db } = req.app.locals.state;
 *
 *   logger.info('Creating user', { email: req.body.email });
 *
 *   // Use db connection pool
 *   const [err, result] = await catchError(
 *     userService.createUser(req.body, { db, logger })
 *   );
 *
 *   // Handle result...
 * }
 * ```
 *
 * ### Example 3: Passing State to Services
 * ```javascript
 * // In controller
 * export async function updateUserController(req, res) {
 *   const state = req.app.locals.state;
 *
 *   // Pass entire state or specific dependencies to service
 *   const [err, result] = await catchError(
 *     userService.updateUser(req.params.id, req.body, state)
 *   );
 *
 *   if (err) {
 *     state.logger.error('Update failed', { error: err });
 *     return error(res, 'Internal error', 500);
 *   }
 *
 *   return result.match({
 *     ok: (user) => success(res, 'User updated', user),
 *     err: (e) => error(res, e.message, 400)
 *   });
 * }
 *
 * // In service
 * export async function updateUser(userId, userData, state) {
 *   return await Result.from(async () => {
 *     state.logger.info('Updating user in database', { userId });
 *
 *     // Use db from state
 *     const result = await state.db.query(
 *       'UPDATE users SET ... WHERE id = ?',
 *       [userId]
 *     );
 *
 *     return result;
 *   });
 * }
 * ```
 *
 * ## Adding New Dependencies to State
 *
 * When you need to add new shared dependencies (e.g., database pool, cache client):
 *
 * 1. Import the dependency in this file
 * 2. Add it to the state object in `createAppState()`
 * 3. Access it via `req.app.locals.state` in your controllers
 *
 * Example:
 * ```javascript
 * import { createPool } from 'mysql2/promise';
 *
 * export function createAppState() {
 *   const dbPool = createPool({ ... });
 *
 *   const state = {
 *     logger,
 *     db: dbPool,  // Add database pool
 *     // Add more dependencies here
 *   };
 *
 *   return state;
 * }
 * ```
 */

import logger from '#lib/util/logger.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { S3Client } from '@aws-sdk/client-s3';
import { sql } from 'drizzle-orm';
import { catchError } from '#lib/util/result.js';
import pkg from 'pg';
const { Pool } = pkg;

/**
 * Creates the application state object containing all shared dependencies
 * and configuration that should be accessible throughout the application.
 *
 * This state object is stored in `app.locals.state` during app initialization
 * and can be accessed in controllers via `req.app.locals.state`.
 *
 * @returns {Promise<Object>} Application state object
 * @throws {Error} If database connection test fails
 */
export async function createAppState() {
    // Create PostgreSQL connection pool
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    // Initialize Drizzle ORM with the pool
    const db_conn = drizzle(pool);

    // Test database connection
    logger.info('Testing database connection...');
    const [err] = await catchError(db_conn.execute(sql`SELECT 1 as test`));

    if (err) {
        logger.error('Database connection test failed', {
            error: err.message,
            stack: err.stack
        });
        throw new Error(`Failed to connect to database: ${err.message}`);
    }

    logger.info('Database connection successful');

    // Initialize S3 client (Cloudflare R2 compatible)
    const s3Client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_URL_API,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_KEY
        }
    });

    const state = {
        db_conn: db_conn,
        s3Client: s3Client,
        logger,
    };

    logger.info('Application state initialized');

    return state;
}
