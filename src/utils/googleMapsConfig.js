/**
 * Google Maps API configuration and utility functions
 */

// Your Google Maps API Key
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with your actual API key

/**
 * Load the Google Maps API script dynamically
 * @returns {Promise} - Resolves when the API is loaded
 */
export const loadGoogleMapsApi = () => {
  // Return a promise that resolves when Google Maps API is loaded
  return new Promise((resolve, reject) => {
    // Check if API is already loaded
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    // Create callback function to be called when API loads
    window.initMap = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps API could not be loaded.'));
      }
    };

    // Create script element and append to document
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * Calculate distance between two coordinates
 * @param {Object} origin - Origin coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @returns {Promise} - Resolves with distance in kilometers
 */
export const calculateDistance = (origin, destination) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const distance = response.rows[0].elements[0].distance.value / 1000; // Convert meters to kilometers
          resolve(distance);
        } else {
          reject(new Error('Error calculating distance'));
        }
      }
    );
  });
};

/**
 * Get address suggestions for autocomplete
 * @param {string} input - User input text
 * @param {Object} options - Additional options
 * @returns {Promise} - Resolves with suggestions array
 */
export const getAddressSuggestions = (input, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const autocompleteService = new window.google.maps.places.AutocompleteService();
    const sessionToken = new window.google.maps.places.AutocompleteSessionToken();

    autocompleteService.getPlacePredictions(
      {
        input,
        sessionToken,
        ...options
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
        } else {
          resolve([]);
        }
      }
    );
  });
};

export default {
  GOOGLE_MAPS_API_KEY,
  loadGoogleMapsApi,
  calculateDistance,
  getAddressSuggestions
};
