/**
 * Membership Controller Layer
 * Handles authentication HTTP requests
 * Manages database transactions and error handling using Result pattern
 */

import { catchError, catchErrorSync } from '#lib/util/result.js';
import { success, error, badRequest, unauthorized } from '#lib/api/response.js';
import { generateToken } from '#lib/util/jwt.js';
import * as membershipService from './membership.service.js';
import * as membershipDTO from './membership.dto.js';
import logger from '#lib/util/logger.js';
import multer from 'multer';
import { generateSignedUrlFromFullUrl } from '#lib/util/s3.js';

/**
 * Login - Authenticate user and return JWT
 * POST /auth/login
 *
 * Body: { email, password }
 */
export async function login(req, res) {
  const { email, password } = req.body;
  const { db_conn } = req.app.locals.state;

  // Execute transaction with callback pattern (auto-commits on success)
  const [txErr, user] = await catchError(
    db_conn.transaction(async (tx) => {
      // Authenticate user inside transaction
      return await membershipService.authenticateUser(tx, email, password);
    })
  );

  if (txErr) {
    // Transaction auto-rolled back on error
    logger.error('Authentication failed', {
      error: txErr.message,
      stack: txErr.stack,
      email
    });

    // Check if it's a user-facing error (invalid credentials)
    if (txErr.message === 'Invalid email or password' ||
        txErr.message === 'Email and password are required') {
      return unauthorized(res, 'Username atau password salah', 103);
    }

    // Internal server error for other cases
    return error(res, 'Internal server error', 500);
  }

  // Generate JWT token (synchronous)
  const tokenResult = generateToken({
    userId: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.lastName
  });

  return tokenResult.match({
    ok: (token) => {
      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      // Transform to DTO (with error handling)
      const [dtoErr, loginResponse] = catchErrorSync(() => membershipDTO.toLoginResponseDTO(token));

      if (dtoErr) {
        logger.error('Failed to transform login response to DTO', {
          error: dtoErr.message,
          stack: dtoErr.stack,
          userId: user.id
        });
        return error(res, 'Internal server error', 500);
      }

      return success(res, 'Login Sukses', loginResponse);
    },
    err: (tokenErr) => {
      logger.error('Failed to generate token', {
        error: tokenErr.message,
        stack: tokenErr.stack,
        userId: user.id
      });
      return error(res, 'Failed to generate authentication token', 500);
    }
  });
}

/**
 * Register - Create new user account
 * POST /auth/register
 *
 * Body: { email, password, first_name, last_name }
 */
export async function register(req, res) {
  const { email, password, first_name, last_name } = req.body;
  const { db_conn } = req.app.locals.state;

  // Execute transaction with callback pattern (auto-commits on success)
  const [txErr, user] = await catchError(
    db_conn.transaction(async (tx) => {
      // Create user inside transaction
      const user = await membershipService.createUser(tx, {
        email,
        password,
        first_name,
        last_name
      });

      // Transaction auto-commits when callback resolves successfully
      return user;
    })
  );

  if (txErr) {
    // Transaction auto-rolled back on error
    logger.error('User registration failed', {
      error: txErr.message,
      stack: txErr.stack,
      email
    });

    // Check if it's a user-facing error (validation or duplicate email)
    if (txErr.message === 'Email sudah terdaftar') {
      return badRequest(res, 'Email sudah terdaftar', null, 102);
    }

    if (txErr.message.includes('required') ||
        txErr.message.includes('Invalid') ||
        txErr.message.includes('must be')) {
      return badRequest(res, txErr.message, null, 102);
    }

    // Internal server error for other cases
    return error(res, 'Internal server error', 500);
  }

  // Return success response with status 0 as specified
  return res.status(200).json({
    status: 0,
    message: 'Registrasi berhasil silahkan login',
    data: null
  });
}

/**
 * Get current user info from JWT
 * GET /profile
 *
 * Requires authentication (req.middleware.auth populated by middleware)
 */
export async function getCurrentProfile(req, res) {
  // User info is already attached by auth middleware
  const userId = req.middleware.auth.user.userId || req.middleware.auth.user.id;
  const { db_conn, s3Client } = req.app.locals.state;

  if (!userId) {
    // This should never happen if authenticate middleware is working correctly
    // If we reach here, it's an internal application error, not an auth issue
    logger.error('Missing userId in authenticated request', {
      authContext: req.middleware.auth,
      path: req.path
    });
    return error(res, 'Internal server error', 500);
  }

  // Fetch fresh user data from database (read-only, no transaction needed)
  const [err, user] = await catchError(membershipService.getUserById(db_conn, userId));

  if (err) {
    // Log error
    logger.error('Failed to fetch current user', {
      error: err.message,
      stack: err.stack,
      userId
    });

    // Internal server error for other cases
    return error(res, 'Internal server error', 500);
  }

  // Generate signed URL for profile image (1 hour expiration)
  let signedProfileImageUrl = null;
  if (user.profileImage) {
    const [signErr, signedUrl] = await catchError(
      generateSignedUrlFromFullUrl(s3Client, user.profileImage, 3600)
    );

    if (signErr) {
      logger.error('Failed to generate signed URL', {
        error: signErr.message,
        stack: signErr.stack,
        userId,
        profileImage: user.profileImage
      });
      return error(res, 'Internal server error', 500);
    }

    signedProfileImageUrl = signedUrl;
  }

  // Transform to DTO with signed URL (with error handling)
  const [dtoErr, profileResponse] = catchErrorSync(() =>
    membershipDTO.toProfileResponseDTO(user, signedProfileImageUrl)
  );

  if (dtoErr) {
    logger.error('Failed to transform profile response to DTO', {
      error: dtoErr.message,
      stack: dtoErr.stack,
      userId
    });
    return error(res, 'Internal server error', 500);
  }

  return success(res, 'Sukses', profileResponse);
}

/**
 * Update current user profile (first_name and last_name)
 * PUT /profile/update
 *
 * Body: { first_name, last_name }
 * Requires authentication (req.middleware.auth populated by middleware)
 */
export async function updateCurrentProfile(req, res) {
  // User info is already attached by auth middleware
  const userId = req.middleware.auth.user.userId || req.middleware.auth.user.id;
  const { first_name, last_name } = req.body;
  const { db_conn, s3Client } = req.app.locals.state;

  if (!userId) {
    // This should never happen if authenticate middleware is working correctly
    logger.error('Missing userId in authenticated request', {
      authContext: req.middleware.auth,
      path: req.path
    });
    return error(res, 'Internal server error', 500);
  }

  // Execute transaction with callback pattern (auto-commits on success)
  const [txErr, user] = await catchError(
    db_conn.transaction(async (tx) => {
      // Update user profile inside transaction
      return await membershipService.updateProfile(tx, userId, {
        first_name,
        last_name
      });
    })
  );

  if (txErr) {
    // Transaction auto-rolled back on error
    logger.error('Failed to update user profile', {
      error: txErr.message,
      stack: txErr.stack,
      userId
    });

    // Return 500 for all service errors
    return error(res, 'Internal server error', 500);
  }

  // Generate signed URL for profile image (1 hour expiration)
  let signedProfileImageUrl = null;
  if (user.profileImage) {
    const [signErr, signedUrl] = await catchError(
      generateSignedUrlFromFullUrl(s3Client, user.profileImage, 3600)
    );

    if (signErr) {
      logger.error('Failed to generate signed URL', {
        error: signErr.message,
        stack: signErr.stack,
        userId,
        profileImage: user.profileImage
      });
      return error(res, 'Internal server error', 500);
    }

    signedProfileImageUrl = signedUrl;
  }

  // Transform to DTO with signed URL (with error handling)
  const [dtoErr, profileResponse] = catchErrorSync(() =>
    membershipDTO.toProfileResponseDTO(user, signedProfileImageUrl)
  );

  if (dtoErr) {
    logger.error('Failed to transform profile response to DTO', {
      error: dtoErr.message,
      stack: dtoErr.stack,
      userId
    });
    return error(res, 'Internal server error', 500);
  }

  return res.status(200).json({
    status: 0,
    message: 'Update Pofile berhasil',
    data: profileResponse
  });
}

/**
 * Update current user profile image
 * PUT /profile/image
 *
 * Body: multipart/form-data with file field
 * Requires authentication (req.middleware.auth populated by middleware)
 */
export async function updateProfileImage(req, res) {
  // User info is already attached by auth middleware
  const userId = req.middleware.auth.user.userId || req.middleware.auth.user.id;
  const { db_conn, s3Client } = req.app.locals.state;

  if (!userId) {
    logger.error('Missing userId in authenticated request', {
      authContext: req.middleware.auth,
      path: req.path
    });
    return error(res, 'Internal server error', 500);
  }

  // Configure multer for memory storage
  const storage = multer.memoryStorage();
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    }
  }).single('file');

  // Handle file upload with multer
  upload(req, res, async (err) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        logger.warn('File size exceeds limit', { userId });
        return res.status(400).json({
          status: 102,
          message: 'File size exceeds 5MB limit',
          data: null
        });
      }
      logger.error('Multer error', { error: err.message, userId });
      return res.status(400).json({
        status: 102,
        message: err.message,
        data: null
      });
    } else if (err) {
      logger.error('Upload error', { error: err.message, userId });
      return error(res, 'Internal server error', 500);
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        status: 102,
        message: 'File is required',
        data: null
      });
    }

    // Validate file mimetype (JPEG or PNG only)
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      logger.warn('Invalid file format', { mimetype: req.file.mimetype, userId });
      return res.status(400).json({
        status: 102,
        message: 'Format Image tidak sesuai',
        data: null
      });
    }

    // Execute transaction with callback pattern (auto-commits on success)
    const [uploadErr, user] = await catchError(
      db_conn.transaction(async (tx) => {
        // Upload image and update profile inside transaction
        return await membershipService.updateProfileImageToS3(
          tx,
          s3Client,
          userId,
          req.file.buffer,
          req.file.mimetype
        );
      })
    );

    if (uploadErr) {
      logger.error('Failed to update profile image', {
        error: uploadErr.message,
        stack: uploadErr.stack,
        userId
      });
      return error(res, 'Internal server error', 500);
    }

    // Generate signed URL for profile image (1 hour expiration)
    let signedProfileImageUrl = null;
    if (user.profileImage) {
      const [signErr, signedUrl] = await catchError(
        generateSignedUrlFromFullUrl(s3Client, user.profileImage, 3600)
      );

      if (signErr) {
        logger.error('Failed to generate signed URL', {
          error: signErr.message,
          stack: signErr.stack,
          userId,
          profileImage: user.profileImage
        });
        return error(res, 'Internal server error', 500);
      }

      signedProfileImageUrl = signedUrl;
    }

    // Transform to DTO with signed URL (with error handling)
    const [dtoErr, profileResponse] = catchErrorSync(() =>
      membershipDTO.toProfileResponseDTO(user, signedProfileImageUrl)
    );

    if (dtoErr) {
      logger.error('Failed to transform profile response to DTO', {
        error: dtoErr.message,
        stack: dtoErr.stack,
        userId
      });
      return error(res, 'Internal server error', 500);
    }

    return res.status(200).json({
      status: 0,
      message: 'Update Profile Image berhasil',
      data: profileResponse
    });
  });
}
