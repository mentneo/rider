import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = '' }) => {
  let dimensions;
  switch (size) {
    case 'small':
      dimensions = 'h-6 w-6';
      break;
    case 'large':
      dimensions = 'h-16 w-16';
      break;
    case 'medium':
    default:
      dimensions = 'h-12 w-12';
  }

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className={`animate-spin rounded-full ${dimensions} border-t-2 border-b-2 border-primary`}></div>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
