/**
 * S3 Utilities
 * Helper functions for S3 operations including signed URL generation
 */

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Generate a signed URL from a full S3 URL
 * Takes full URL like: https://xxxxx.com/bucket-name/user_photos/file.jpg
 * And generates a signed version with expiration
 *
 * @param {object} s3Client - AWS S3 client instance
 * @param {string} fullUrl - Full S3 URL stored in database
 * @param {number} expiresInSeconds - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export async function generateSignedUrlFromFullUrl(s3Client, fullUrl, expiresInSeconds = 3600) {
  if (!fullUrl) {
    throw new Error('Full URL is required');
  }

  // Extract the S3 key from the full URL
  // Format: https://xxxxx.com/bucket-name/user_photos/file.jpg
  // We need: user_photos/file.jpg
  const url = new URL(fullUrl);
  const bucketName = process.env.S3_BUCKET_NAME;

  // Get path parts and find the key after bucket name
  const pathParts = url.pathname.split('/').filter(part => part);
  const bucketIndex = pathParts.indexOf(bucketName);

  if (bucketIndex === -1 || bucketIndex >= pathParts.length - 1) {
    throw new Error('Invalid S3 URL format');
  }

  const s3Key = pathParts.slice(bucketIndex + 1).join('/');

  // Generate signed URL
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return signedUrl;
}
