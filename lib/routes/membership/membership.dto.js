/**
 * Membership Data Transfer Objects (DTOs)
 * Defines the structure of data returned from membership controllers
 */

/**
 * Transform raw user data from database to UserDTO format
 *
 * @param {object} user - Raw user data from database
 * @returns {object} UserDTO
 */
export function toUserDTO(user) {
  return {
    email: user.email,
    first_name: user.firstName || user.first_name,
    last_name: user.lastName || user.last_name,
    profile_image: user.profileImage || user.profile_image
  };
}

/**
 * Transform user data to LoginResponseDTO format
 *
 * @param {string} token - JWT token
 * @returns {object} LoginResponseDTO
 */
export function toLoginResponseDTO(token) {
  return {
    token
  };
}

/**
 * Transform user data to ProfileResponseDTO format
 *
 * @param {object} user - Raw user data from database
 * @param {string} signedProfileImageUrl - Optional signed URL for profile image
 * @returns {object} ProfileResponseDTO
 */
export function toProfileResponseDTO(user, signedProfileImageUrl = null) {
  return {
    email: user.email,
    first_name: user.firstName || user.first_name,
    last_name: user.lastName || user.last_name,
    profile_image: signedProfileImageUrl || user.profileImage || user.profile_image
  };
}

/**
 * DTO Schemas Documentation
 *
 * UserDTO:
 * {
 *   email: string,
 *   first_name: string,
 *   last_name: string,
 *   profile_image: string
 * }
 *
 * LoginResponseDTO:
 * {
 *   token: string
 * }
 *
 * ProfileResponseDTO:
 * {
 *   email: string,
 *   first_name: string,
 *   last_name: string,
 *   profile_image: string
 * }
 */
