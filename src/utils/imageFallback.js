/**
 * Utility functions for handling image loading fallbacks
 */

// Default fallback image URLs for different entities
const DEFAULT_IMAGES = {
  CAR: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  DRIVER: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  USER: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  PLACEHOLDER: 'https://via.placeholder.com/500x300?text=Image+Not+Available'
};

/**
 * Handle image load errors by replacing with fallback
 * @param {Event} event - The error event
 * @param {string} type - Type of fallback to use (CAR, DRIVER, USER)
 */
export const handleImageError = (event, type = 'PLACEHOLDER') => {
  if (event && event.target) {
    event.target.src = DEFAULT_IMAGES[type] || DEFAULT_IMAGES.PLACEHOLDER;
    // Prevent infinite error loops if the fallback also fails
    event.target.onerror = null;
  }
};

/**
 * Get appropriate fallback URL for a specific entity type
 * @param {string} type - Entity type (CAR, DRIVER, USER)
 * @returns {string} - Fallback image URL
 */
export const getFallbackImage = (type = 'PLACEHOLDER') => {
  return DEFAULT_IMAGES[type] || DEFAULT_IMAGES.PLACEHOLDER;
};

/**
 * Returns an image URL or fallback if URL is invalid/empty
 * @param {string} imageUrl - Original image URL
 * @param {string} type - Entity type (CAR, DRIVER, USER)
 * @returns {string} - Valid image URL
 */
export const getImageWithFallback = (imageUrl, type = 'PLACEHOLDER') => {
  return imageUrl || getFallbackImage(type);
};

export default {
  DEFAULT_IMAGES,
  handleImageError,
  getFallbackImage,
  getImageWithFallback
};
