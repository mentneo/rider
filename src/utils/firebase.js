import { toast } from 'react-toastify';

/**
 * Handle Firestore errors, providing appropriate user feedback
 * @param {Error} error - The Firebase error object
 * @param {string} defaultMessage - Default message to show if not a specific handled case
 */
export const handleFirestoreError = (error, defaultMessage = 'An error occurred') => {
  console.error('Firestore error:', error);
  
  let errorMessage = defaultMessage;
  
  if (error.code === 'failed-precondition' && error.message.includes('index')) {
    errorMessage = 'The database needs indexing. Please contact the admin to fix this issue.';
    console.warn('Index required:', error.message);
    
    // For development purposes, extract the index creation URL
    const indexUrlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
    if (indexUrlMatch) {
      console.info('Create index here:', indexUrlMatch[0]);
    }
  } else if (error.code === 'permission-denied') {
    errorMessage = 'You do not have permission to access this data';
  } else if (error.code === 'unavailable') {
    errorMessage = 'Service temporarily unavailable. Please try again later.';
  }
  
  toast.error(errorMessage);
  return errorMessage;
};

/**
 * Creates a simulated delay for development/demo purposes
 * @param {number} ms - Milliseconds to delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Formats Firebase timestamp or ISO date string to a readable date
 * @param {object|string} timestamp - Firebase timestamp object or ISO date string
 * @param {object} options - Date formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, options = {}) => {
  if (!timestamp) return '';
  
  try {
    const date = typeof timestamp === 'string' 
      ? new Date(timestamp) 
      : new Date(timestamp.seconds * 1000);
    
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};
