'use client';

import { useState, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface FairValueCardProps {
  modelName: string;
  fairValue: number | null;
  currentPrice?: number;
  assumptions?: Record<string, any>;
  currency?: string;
}

/**
 * FairValueCard component displays valuation model results
 * Requirements: 2.3, 2.4, 2.5, 2.6, 3.1
 */
export default function FairValueCard({
  modelName,
  fairValue,
  currentPrice,
  assumptions,
  currency = 'USD',
}: FairValueCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate price difference percentage
  const priceDifference = fairValue && currentPrice
    ? ((fairValue - currentPrice) / currentPrice) * 100
    : 0;

  // Determine valuation status (Requirements: 2.4, 2.5, 2.6)
  const getValuationStatus = (): 'undervalued' | 'overvalued' | 'fair' => {
    if (!fairValue || !currentPrice) return 'fair';
    
    if (priceDifference >= 10) return 'undervalued';
    if (priceDifference <= -10) return 'overvalued';
    return 'fair';
  };

  const valuationStatus = getValuationStatus();

  // Status text
  const statusText = {
    undervalued: 'Undervalued',
    overvalued: 'Overvalued',
    fair: 'Fairly Priced',
  }[valuationStatus];

  // Status badge classes with soft colors (Requirements: 2.4, 2.5, 2.6)
  const statusClasses = {
    undervalued: 'bg-green-50 text-green-700 border border-green-200',
    overvalued: 'bg-red-50 text-red-700 border border-red-200',
    fair: 'bg-white text-gray-700 border border-gray-200',
  }[valuationStatus];

  // Status dot classes
  const statusDotClasses = {
    undervalued: 'bg-green-500',
    overvalued: 'bg-red-500',
    fair: 'bg-gray-400',
  }[valuationStatus];

  // Format currency
  const formatCurrency = (value: number | null): string => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format assumption key (convert camelCase to readable)
  const formatAssumptionKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Format assumption value
  const formatAssumptionValue = (key: string, value: any): string => {
    if (typeof value === 'number') {
      // Check if it's a percentage (rate, growth, etc.)
      if (
        key.toLowerCase().includes('rate') ||
        key.toLowerCase().includes('growth') ||
        key.toLowerCase().includes('wacc')
      ) {
        return `${(value * 100).toFixed(2)}%`;
      }
      // Check if it's a year count
      if (key.toLowerCase().includes('years')) {
        return `${value} years`;
      }
      // Otherwise format as number
      return value.toFixed(2);
    }
    return String(value);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow">
      {/* Model Name and Info Icon */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-black">
          {modelName}
        </h3>

        {/* Tooltip for Assumptions (Requirements: 3.1) */}
        {assumptions && Object.keys(assumptions).length > 0 && (
          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="View assumptions"
                >
                  <InformationCircleIcon className="w-5 h-5" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 max-w-xs z-50"
                  sideOffset={5}
                >
                  <div className="font-semibold mb-2">Key Assumptions:</div>
                  <div className="space-y-1">
                    {Object.entries(assumptions).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4">
                        <span className="text-gray-300">{formatAssumptionKey(key)}:</span>
                        <span className="font-medium">{formatAssumptionValue(key, value)}</span>
                      </div>
                    ))}
                  </div>
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )}
      </div>

      {/* Fair Value */}
      {fairValue !== null ? (
        <div className="mb-3 sm:mb-4">
          <div className="text-2xl sm:text-3xl font-bold text-black">
            {formatCurrency(fairValue)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">Fair Value</div>
        </div>
      ) : (
        <div className="mb-3 sm:mb-4">
          <div className="text-xl sm:text-2xl font-semibold text-gray-400">N/A</div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">
            Not applicable for this stock
          </div>
        </div>
      )}

      {/* Valuation Status Badge (Requirements: 2.4, 2.5, 2.6) */}
      {fairValue !== null && currentPrice && (
        <div className="mt-3 sm:mt-4">
          <div
            className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusClasses}`}
          >
            <span className={`w-2 h-2 rounded-full mr-1.5 sm:mr-2 ${statusDotClasses}`}></span>
            {statusText}
          </div>

          {/* Price Difference */}
          <div className="mt-2 text-xs sm:text-sm text-gray-600">
            {priceDifference > 0 ? (
              <span>{Math.abs(priceDifference).toFixed(1)}% above current price</span>
            ) : priceDifference < 0 ? (
              <span>{Math.abs(priceDifference).toFixed(1)}% below current price</span>
            ) : (
              <span>At current price</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
