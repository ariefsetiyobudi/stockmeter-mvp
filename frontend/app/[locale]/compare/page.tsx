'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useBatchComparison } from '@/hooks/useStockData';
import StockTable from '@/components/StockTable';
import StockSearchBar from '@/components/StockSearchBar';
import { useRouter } from 'next/navigation';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/**
 * Comparison page for batch stock comparison
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export default function ComparePage() {
  const router = useRouter();
  const { isAuthenticated, isPro } = useAuthStore();
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch comparison data
  const { data: comparisonData, isLoading, error } = useBatchComparison(selectedTickers);

  // Check authentication
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      toast.error('Please login to use comparison feature');
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Add stock to comparison
  const handleAddStock = (ticker: string) => {
    // Check if user is Pro for more than 1 stock (Requirement 4.4)
    if (!isPro && selectedTickers.length >= 1) {
      toast.error('Upgrade to Pro to compare multiple stocks');
      setShowSearch(false);
      return;
    }

    // Check limit of 50 stocks for Pro users (Requirement 4.2)
    if (selectedTickers.length >= 50) {
      toast.error('Maximum 50 stocks allowed for comparison');
      setShowSearch(false);
      return;
    }

    // Check if already added
    if (selectedTickers.includes(ticker)) {
      toast.error('Stock already added to comparison');
      setShowSearch(false);
      return;
    }

    setSelectedTickers([...selectedTickers, ticker]);
    setShowSearch(false);
    toast.success(`${ticker} added to comparison`);
  };

  // Remove stock from comparison
  const handleRemoveStock = (ticker: string) => {
    setSelectedTickers(selectedTickers.filter((t) => t !== ticker));
    toast.success(`${ticker} removed from comparison`);
  };

  // Handle export (Pro only)
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!isPro) {
      toast.error('Upgrade to Pro to export data');
      return;
    }

    try {
      const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001';
      const tickers = selectedTickers.join(',');
      const url = `${API_BASE_URL}/api/download?format=${format}&tickers=${tickers}`;
      
      // Open in new window to trigger download
      window.open(url, '_blank');
      toast.success(`Exporting as ${format.toUpperCase()}...`);
    } catch (error) {
      toast.error('Export failed. Please try again.');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Requirements: 12.1, 12.2 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Stock Comparison</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Compare fair values across multiple stocks
            {!isPro && (
              <span className="block sm:inline sm:ml-2 text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                (Free tier: 1 stock only)
              </span>
            )}
          </p>
        </div>

        {/* Upgrade Prompt for Free Users (Requirement 4.4) - Requirements: 12.1, 12.2 */}
        {!isPro && (
          <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-1">
                  Upgrade to Pro for Unlimited Comparisons
                </h3>
                <p className="text-xs sm:text-sm text-blue-700">
                  Compare up to 50 stocks side-by-side and export results
                </p>
              </div>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full sm:w-auto px-4 py-2 min-h-touch bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Add Stock Section - Requirements: 12.1, 12.2 */}
        <div className="mb-4 sm:mb-6 bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-black">
              Selected Stocks ({selectedTickers.length}{isPro ? '/50' : '/1'})
            </h2>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="inline-flex items-center justify-center px-4 py-2 min-h-touch bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={(!isPro && selectedTickers.length >= 1) || selectedTickers.length >= 50}
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Stock
            </button>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mb-4">
              <StockSearchBar
                onSelect={handleAddStock}
                placeholder="Search for a stock to add..."
              />
            </div>
          )}

          {/* Selected Tickers */}
          {selectedTickers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTickers.map((ticker) => (
                <div
                  key={ticker}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  <span className="font-medium">{ticker}</span>
                  <button
                    onClick={() => handleRemoveStock(ticker)}
                    className="ml-2 text-gray-500 hover:text-red-600 transition-colors"
                    aria-label={`Remove ${ticker}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedTickers.length === 0 && (
            <p className="text-gray-500 text-sm">
              No stocks selected. Click "Add Stock" to get started.
            </p>
          )}
        </div>

        {/* Export Buttons (Pro only) - Requirements: 12.1, 12.2 */}
        {selectedTickers.length > 0 && isPro && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center justify-center px-4 py-2 min-h-touch bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center justify-center px-4 py-2 min-h-touch bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Export PDF
            </button>
          </div>
        )}

        {/* Comparison Table */}
        {isLoading && selectedTickers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="mt-4 text-gray-600">Loading comparison data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700">
              Failed to load comparison data. Please try again.
            </p>
          </div>
        )}

        {comparisonData && comparisonData.length > 0 && (
          <StockTable
            data={comparisonData}
            onRemove={handleRemoveStock}
            showRemoveButton={true}
          />
        )}

        {selectedTickers.length === 0 && !isLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-4">
              Add stocks to start comparing their fair values
            </p>
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
