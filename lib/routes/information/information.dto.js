/**
 * Information Data Transfer Objects (DTOs)
 * Defines the structure of data returned from information controllers
 */

/**
 * Transform raw banner data from database to BannerDTO format
 *
 * @param {object} banner - Raw banner data from database
 * @returns {object} BannerDTO
 */
export function toBannerDTO(banner) {
  return {
    banner_name: banner.name,
    banner_image: banner.image_url,
    description: banner.description
  };
}

/**
 * Transform raw service data from database to ServiceDTO format
 *
 * @param {object} service - Raw service data from database
 * @returns {object} ServiceDTO
 */
export function toServiceDTO(service) {
  return {
    service_code: service.code,
    service_name: service.name,
    service_icon: service.icon_url,
    service_tariff: service.tariff
  };
}

/**
 * DTO Schemas Documentation
 *
 * BannerDTO:
 * {
 *   banner_name: string,
 *   banner_image: string,
 *   description: string
 * }
 *
 * ServiceDTO:
 * {
 *   service_code: string,
 *   service_name: string,
 *   service_icon: string,
 *   service_tariff: number
 * }
 */
