'use client';

import { useEffect } from 'react';

/**
 * Error boundary for route errors
 * Requirements: 12.4 - Mobile performance optimization
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-red-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          We encountered an error while loading this page. Please try again.
        </p>
        <button
          onClick={reset}
          className="w-full sm:w-auto px-6 py-3 min-h-touch bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
