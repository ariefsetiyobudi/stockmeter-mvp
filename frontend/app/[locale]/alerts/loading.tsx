import { AlertListSkeleton } from '@/components/SkeletonLoader';

/**
 * Loading state for alerts page
 * Requirements: All - Loading states for route transitions
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="animate-pulse bg-gray-200 h-8 w-48 rounded mb-2"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-64 rounded"></div>
        </div>
        <AlertListSkeleton />
      </div>
    </div>
  );
}
