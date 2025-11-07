/**
 * Information Service Layer
 * Contains banner and services business logic
 * Uses Drizzle ORM with Raw SQL for database operations
 *
 * NOTE: All service functions accept a db connection (db_conn) parameter
 * Services throw errors - errors are caught in controllers
 */

import { sql } from 'drizzle-orm';

/**
 * Get all banners
 *
 * @param {object} db_conn - Drizzle connection object
 * @returns {Promise<Array>} Array of banner objects
 * @throws {Error} If database query fails
 */
export async function getAllBanners(db_conn) {
  const result = await db_conn.execute(
    sql`SELECT name, image_url, description
        FROM banners
        ORDER BY id ASC`
  );

  return result.rows;
}

/**
 * Get all services
 *
 * @param {object} db_conn - Drizzle connection object
 * @returns {Promise<Array>} Array of service objects
 * @throws {Error} If database query fails
 */
export async function getAllServices(db_conn) {
  const result = await db_conn.execute(
    sql`SELECT code, name, icon_url, tariff
        FROM services
        ORDER BY id ASC`
  );

  return result.rows;
}
