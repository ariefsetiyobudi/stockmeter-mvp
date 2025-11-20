'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Combobox } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useStockSearch } from '@/hooks/useStockData';
import type { StockSearchResult } from '@/types';

interface StockSearchBarProps {
  className?: string;
  placeholder?: string;
  onSelect?: (ticker: string) => void;
}

/**
 * StockSearchBar component with autocomplete functionality
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export default function StockSearchBar({
  className = '',
  placeholder = 'Search stocks by ticker or company name...',
  onSelect,
}: StockSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the stock search hook with debouncing (300ms)
  const { data: searchResults = [], isLoading, error } = useStockSearch(query);

  const handleSelect = (stock: StockSearchResult | null) => {
    if (stock) {
      setSelectedStock(stock);
      setQuery('');
      
      // Call custom onSelect handler if provided
      if (onSelect) {
        onSelect(stock.ticker);
      } else {
        // Default behavior: navigate to stock detail page
        router.push(`/stocks/${stock.ticker}`);
      }
    }
  };

  // Clear selection when query changes
  useEffect(() => {
    if (query && selectedStock) {
      setSelectedStock(null);
    }
  }, [query, selectedStock]);

  return (
    <div className={`relative w-full ${className}`}>
      <Combobox value={selectedStock} onChange={handleSelect}>
        <div className="relative">
          <div className="relative w-full">
            <Combobox.Input
              ref={inputRef}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder={placeholder}
              displayValue={(stock: StockSearchResult | null) => stock?.ticker || ''}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            
            {/* Search Icon / Loading Spinner */}
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {isLoading ? (
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 animate-spin"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {query.length >= 2 && (
            <Combobox.Options className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 sm:max-h-96 overflow-y-auto">
              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 text-sm text-red-600">
                  {error.message || 'Failed to search stocks'}
                </div>
              )}

              {/* Search Results */}
              {!error && searchResults.length > 0 && (
                <>
                  {searchResults.map((result) => (
                    <Combobox.Option
                      key={result.ticker}
                      value={result}
                      className={({ active }) =>
                        `px-3 sm:px-4 py-2 sm:py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                          active ? 'bg-gray-50' : 'bg-white'
                        }`
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-gray-900">
                            {result.ticker}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate">
                            {result.name}
                          </div>
                        </div>
                        <div className="ml-2 sm:ml-4 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                          {result.exchange}
                        </div>
                      </div>
                    </Combobox.Option>
                  ))}
                </>
              )}

              {/* No Results */}
              {!error && !isLoading && searchResults.length === 0 && query.length >= 2 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No stocks found
                </div>
              )}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
    </div>
  );
}
