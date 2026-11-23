import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--paper)]">
        <Loader2 className="w-9 h-9 text-[var(--rust)] animate-spin mb-3" />
        <p className="text-gray-500 font-medium text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-sky-600 animate-spin mb-2" />
      <p className="text-gray-500 text-sm font-medium">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
