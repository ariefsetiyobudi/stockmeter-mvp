/**
 * Skeleton loader components for better loading UX
 * Requirements: All - Loading states with skeleton loaders
 */

/**
 * Base skeleton component
 */
export function Skeleton({
  className = '',
  width,
  height,
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Skeleton for stock search results
 */
export function StockSearchSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for fair value card
 */
export function FairValueCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/**
 * Skeleton for stock detail page
 */
export function StockDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Fair value cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <FairValueCardSkeleton key={i} />
          ))}
        </div>

        {/* Description skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for stock table
 */
export function StockTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Table header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for watchlist page
 */
export function WatchlistSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <StockTableSkeleton rows={5} />
      </div>
    </div>
  );
}

/**
 * Skeleton for comparison page
 */
export function ComparisonSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <StockTableSkeleton rows={10} />
      </div>
    </div>
  );
}

/**
 * Skeleton for alert list
 */
export function AlertListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for profile page
 */
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48 mb-6" />
        
        {/* User info section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* Subscription section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
