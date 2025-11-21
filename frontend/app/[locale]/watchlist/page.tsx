'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useWatchlistStore } from '@/stores/watchlist';
import { useWatchlistData } from '@/hooks/useStockData';
import StockTable from '@/components/StockTable';
import StockSearchBar from '@/components/StockSearchBar';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/**
 * Watchlist page for monitoring saved stocks
 * Requirements: 5.2, 5.3, 5.4
 */
export default function WatchlistPage() {
  const router = useRouter();
  const { isAuthenticated, isPro } = useAuthStore();
  const { watchlist, isLoading: storeLoading, loadWatchlist, removeFromWatchlist, addToWatchlist } = useWatchlistStore();
  const [showSearch, setShowSearch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch watchlist data with fair values
  const { data: watchlistData, isLoading: dataLoading, refetch } = useWatchlistData(watchlist.map(item => item.ticker));

  // Check authentication
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      toast.error('Please login to view your watchlist');
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Load watchlist on mount
  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadWatchlist();
    }
  }, [mounted, isAuthenticated, loadWatchlist]);

  // Calculate watchlist limit
  const watchlistLimit = isPro ? Infinity : 5;
  const isAtLimit = watchlist.length >= watchlistLimit;
  const limitPercentage = isPro ? 0 : (watchlist.length / watchlistLimit) * 100;

  // Handle add stock
  const handleAddStock = async (ticker: string) => {
    try {
      await addToWatchlist(ticker);
      setShowSearch(false);
      // Refetch data to get the new stock's fair value
      refetch();
    } catch (error) {
      // Error already handled in store
    }
  };

  // Handle remove stock
  const handleRemoveStock = async (ticker: string) => {
    try {
      await removeFromWatchlist(ticker);
    } catch (error) {
      // Error already handled in store
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadWatchlist();
    refetch();
    toast.success('Refreshing watchlist...');
  };

  const isLoading = storeLoading || dataLoading;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Requirements: 12.1, 12.2 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">My Watchlist</h1>
            <p className="text-sm sm:text-base text-gray-600">Monitor your favorite stocks and their valuation status</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-2 min-h-touch bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Watchlist Limit Indicator (Requirement 5.3, 5.4) - Requirements: 12.1, 12.2 */}
        <div
          className={`mb-4 sm:mb-6 rounded-lg p-3 sm:p-4 ${
            isAtLimit && !isPro
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {!isPro ? (
                <>
                  {watchlist.length} / {watchlistLimit} stocks
                  {isAtLimit && <span className="ml-2 text-red-600 font-semibold">(Limit reached)</span>}
                </>
              ) : (
                <>{watchlist.length} stocks in watchlist</>
              )}
            </span>
            {!isPro && isAtLimit && (
              <button
                onClick={() => router.push('/pricing')}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-semibold min-h-touch"
              >
                Upgrade for unlimited
              </button>
            )}
          </div>
          {!isPro && (
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAtLimit ? 'bg-linear-to-r from-yellow-400 to-yellow-600' : 'bg-linear-to-r from-green-400 to-green-600'
                }`}
                style={{ width: `${limitPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Upgrade Prompt for Free Users at Limit (Requirement 5.4) - Requirements: 12.1, 12.2 */}
        {!isPro && isAtLimit && (
          <div className="mb-4 sm:mb-6 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="shrink-0">
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-1">Watchlist Limit Reached</h3>
                <p className="text-sm sm:text-base text-purple-100">
                  Upgrade to Pro for unlimited watchlist stocks and advanced features
                </p>
              </div>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full sm:w-auto px-6 py-3 min-h-touch bg-white text-purple-600 font-semibold rounded-md hover:bg-purple-50 transition-colors whitespace-nowrap text-center"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Add Stock Section - Requirements: 12.1, 12.2 */}
        <div className="mb-4 sm:mb-6 bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-black">Add Stock to Watchlist</h2>
            <button
              onClick={() => setShowSearch(!showSearch)}
              disabled={isAtLimit && !isPro}
              className="inline-flex items-center justify-center px-4 py-2 min-h-touch bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Stock
            </button>
          </div>

          {showSearch && (
            <StockSearchBar
              onSelect={handleAddStock}
              placeholder="Search for stocks to add..."
            />
          )}
        </div>

        {/* Loading State */}
        {isLoading && watchlist.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
            <p className="text-gray-600">Loading your watchlist...</p>
          </div>
        )}

        {/* Watchlist Table (Requirement 5.2) */}
        {!isLoading && watchlistData && watchlistData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Your Stocks</h2>
            <StockTable
              data={watchlistData}
              onRemove={handleRemoveStock}
              showRemoveButton={true}
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && watchlist.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-600 mb-6">Add stocks above to start monitoring their valuation status</p>
            <button
              onClick={() => setShowSearch(true)}
              className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Your First Stock
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
