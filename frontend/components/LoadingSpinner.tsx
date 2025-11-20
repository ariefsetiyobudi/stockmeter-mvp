/**
 * Reusable loading spinner component
 * Requirements: All - Loading states for async operations
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'black' | 'white' | 'gray';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'black',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
    xl: 'h-16 w-16 border-4',
  };

  const colorClasses = {
    black: 'border-black border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
  };

  const spinner = (
    <div
      className={`inline-block animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {spinner}
          {text && (
            <p className="mt-4 text-gray-600 text-sm sm:text-base">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {spinner}
      {text && <span className="ml-3 text-gray-600">{text}</span>}
    </div>
  );
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} text-white`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
