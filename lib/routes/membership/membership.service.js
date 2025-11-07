/**
 * Membership Service Layer
 * Contains authentication and user management business logic
 * Uses Drizzle ORM with Raw SQL for database operations
 *
 * NOTE: All service functions accept a transaction (tx) parameter
 * Services throw errors instead of returning Result - errors are caught in controllers
 */

import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

/**
 * Get bcrypt salt rounds from environment
 */
function getSaltRounds() {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
  if (isNaN(saltRounds) || saltRounds < 4 || saltRounds > 31) {
    throw new Error('BCRYPT_SALT_ROUNDS must be a number between 4 and 31');
  }
  return saltRounds;
}

/**
 * Authenticate user with email and password
 *
 * @param {object} tx - Drizzle transaction object
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @returns {Promise<object>} User object without password
 * @throws {Error} If authentication fails
 */
export async function authenticateUser(tx, email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user by email using raw SQL
  const result = await tx.execute(
    sql`SELECT id, email, password_hash, first_name, last_name, profile_image
        FROM users
        WHERE email = ${email.toLowerCase()}
        LIMIT 1`
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Return user without password
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    lastName: user.last_name,
    profileImage: user.profile_image
  };
}

/**
 * Get user by ID
 * Used to validate tokens and get fresh user data
 *
 * @param {object} tx - Drizzle transaction object
 * @param {number|string} userId - User ID
 * @returns {Promise<object>} User object without password
 * @throws {Error} If user not found
 */
export async function getUserById(tx, userId) {
  const result = await tx.execute(
    sql`SELECT id, email, first_name, last_name, profile_image
        FROM users
        WHERE id = ${parseInt(userId)}
        LIMIT 1`
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    profileImage: user.profile_image
  };
}

/**
 * Create a new user (for registration)
 *
 * @param {object} tx - Drizzle transaction object
 * @param {object} userData - User data { email, password, first_name, last_name }
 * @returns {Promise<object>} Created user object without password
 * @throws {Error} If validation fails or email already exists
 */
export async function createUser(tx, userData) {
  const { email, password, first_name, last_name } = userData;

  if (!email || !password || !first_name || !last_name) {
    throw new Error('Email, password, first name, and last name are required');
  }

  // Check if email already exists
  const existingUserResult = await tx.execute(
    sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`
  );

  if (existingUserResult.rows.length > 0) {
    throw new Error('Email sudah terdaftar');
  }

  // Hash password with salt rounds from environment
  const saltRounds = getSaltRounds();
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Generate default profile image URL from S3
  const defaultProfileImage = `${process.env.S3_URL_API}/${process.env.S3_BUCKET_NAME}/user_photos/default_photos.jpg`;

  // Insert new user using raw SQL
  const insertResult = await tx.execute(
    sql`INSERT INTO users (email, password_hash, first_name, last_name, profile_image)
        VALUES (${email.toLowerCase()}, ${hashedPassword}, ${first_name}, ${last_name}, ${defaultProfileImage})
        RETURNING id, email, first_name, last_name, profile_image`
  );

  if (insertResult.rows.length === 0) {
    throw new Error('Failed to create user');
  }

  const newUser = insertResult.rows[0];

  // Return user without password
  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.first_name,
    lastName: newUser.last_name,
    profileImage: newUser.profile_image
  };
}

/**
 * Get user by email
 * Used to check if email exists
 *
 * @param {object} tx - Drizzle transaction object
 * @param {string} email - User email
 * @returns {Promise<object|null>} User object without password, or null if not found
 */
export async function getUserByEmail(tx, email) {
  const result = await tx.execute(
    sql`SELECT id, email, first_name, last_name, profile_image
        FROM users
        WHERE email = ${email.toLowerCase()}
        LIMIT 1`
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    profileImage: user.profile_image
  };
}

/**
 * Update user profile (first_name and last_name)
 *
 * @param {object} tx - Drizzle transaction object
 * @param {number|string} userId - User ID
 * @param {object} updateData - Update data { first_name, last_name }
 * @returns {Promise<object>} Updated user object without password
 * @throws {Error} If user not found or update fails
 */
export async function updateProfile(tx, userId, updateData) {
  const { first_name, last_name } = updateData;

  if (!first_name || !last_name) {
    throw new Error('First name and last name are required');
  }

  // Update user profile
  const result = await tx.execute(
    sql`UPDATE users
        SET first_name = ${first_name},
            last_name = ${last_name}
        WHERE id = ${parseInt(userId)}
        RETURNING id, email, first_name, last_name, profile_image`
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    profileImage: user.profile_image
  };
}

/**
 * Upload profile image to S3 and update user profile_image URL
 *
 * @param {object} tx - Drizzle transaction object
 * @param {object} s3Client - AWS S3 client instance
 * @param {number|string} userId - User ID
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} mimetype - File mimetype (image/jpeg or image/png)
 * @returns {Promise<object>} Updated user object with new profile_image URL
 * @throws {Error} If upload or database update fails
 */
export async function updateProfileImageToS3(tx, s3Client, userId, fileBuffer, mimetype) {
  if (!fileBuffer) {
    throw new Error('File buffer is required');
  }

  // Determine file extension from mimetype
  const fileExtension = mimetype === 'image/jpeg' ? 'jpeg' : 'png';

  // Generate filename: {uuid}_{user_id}_{timestamptz}.{file_format}
  const uuid = crypto.randomUUID();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${uuid}_${userId}_${timestamp}.${fileExtension}`;
  const s3Key = `user_photos/${filename}`;

  // Upload to S3
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
  } catch (error) {
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }

  // Construct the public URL
  const imageUrl = `${process.env.S3_URL_API}/${process.env.S3_BUCKET_NAME}/${s3Key}`;

  // Update user's profile_image in database
  const result = await tx.execute(
    sql`UPDATE users
        SET profile_image = ${imageUrl}
        WHERE id = ${parseInt(userId)}
        RETURNING id, email, first_name, last_name, profile_image`
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const updatedUser = result.rows[0];

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    firstName: updatedUser.first_name,
    lastName: updatedUser.last_name,
    profileImage: updatedUser.profile_image
  };
}
