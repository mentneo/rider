import React from 'react';
import { Link } from 'react-router-dom';

const ErrorState = ({ message, showHomeLink = true }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto my-12">
      <svg 
        className="h-16 w-16 text-red-500 mx-auto mb-4" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
        />
      </svg>
      <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-6">{message || "We couldn't load the data you're looking for. Please try again later."}</p>
      {showHomeLink && (
        <Link 
          to="/" 
          className="inline-block bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary-dark transition-colors"
        >
          Go back to homepage
        </Link>
      )}
    </div>
  );
};

export default ErrorState;
