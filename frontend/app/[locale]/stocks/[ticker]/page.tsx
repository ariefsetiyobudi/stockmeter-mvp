'use client';

import { use } from 'react';
import Link from 'next/link';
import { useStockDetail, useFairValue } from '@/hooks/useStockData';
import FairValueCard from '@/components/FairValueCard';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface StockDetailPageProps {
  params: Promise<{ ticker: string }>;
}

/**
 * Stock detail page showing company profile and fair value calculations
 * Requirements: 2.1, 2.2, 2.3, 3.2
 */
export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { ticker } = use(params);
  const tickerUpper = ticker.toUpperCase();

  // Fetch stock detail and fair value data
  const {
    data: stockDetail,
    isLoading: detailLoading,
    error: detailError,
  } = useStockDetail(tickerUpper);

  const {
    data: fairValueData,
    isLoading: fairValueLoading,
    error: fairValueError,
  } = useFairValue(tickerUpper);

  // Loading state
  if (detailLoading || fairValueLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (detailError || fairValueError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Stock Data</h2>
            <p className="text-red-600">
              {detailError?.message || fairValueError?.message || 'Failed to load stock information'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!stockDetail || !fairValueData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Data Available</h2>
            <p className="text-yellow-600">Stock information not found for {tickerUpper}</p>
          </div>
        </div>
      </div>
    );
  }

  const { currentPrice, dcf, ddm, relativeValue, graham } = fairValueData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Back Button - Requirements: 12.1, 12.2 */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors min-h-touch"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Stock Header (Requirements: 2.1) - Requirements: 12.1, 12.2 */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {stockDetail.ticker}
              </h1>
              <h2 className="text-lg sm:text-xl text-gray-600 mb-4">{stockDetail.name}</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500">Exchange:</span>
                  <div className="font-semibold text-gray-900">{stockDetail.exchange}</div>
                </div>
                <div>
                  <span className="text-gray-500">Sector:</span>
                  <div className="font-semibold text-gray-900">{stockDetail.sector}</div>
                </div>
                <div>
                  <span className="text-gray-500">Industry:</span>
                  <div className="font-semibold text-gray-900">{stockDetail.industry}</div>
                </div>
                <div>
                  <span className="text-gray-500">Market Cap:</span>
                  <div className="font-semibold text-gray-900">
                    ${(stockDetail.marketCap / 1e9).toFixed(2)}B
                  </div>
                </div>
              </div>
            </div>

            {/* Current Price */}
            <div className="bg-gray-50 rounded-lg p-4 text-center sm:text-right">
              <div className="text-xs sm:text-sm text-gray-500 mb-1">Current Price</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Description */}
          {stockDetail.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-600 leading-relaxed">{stockDetail.description}</p>
            </div>
          )}
        </div>

        {/* Action Buttons - Requirements: 12.1, 12.2 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            className="inline-flex items-center justify-center px-4 py-2 min-h-touch bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => {
              // TODO: Implement add to watchlist
              console.log('Add to watchlist:', tickerUpper);
            }}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add to Watchlist
          </button>

          <Link
            href={`/stocks/${tickerUpper}/details`}
            className="inline-flex items-center justify-center px-4 py-2 min-h-touch bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Detailed Breakdown
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              Pro
            </span>
          </Link>
        </div>

        {/* Fair Value Models (Requirements: 2.2, 2.3) - Requirements: 12.1, 12.2 */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Fair Value Analysis</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* DCF Model */}
            <FairValueCard
              modelName="DCF Model"
              fairValue={dcf?.fairValue ?? null}
              currentPrice={currentPrice}
              assumptions={dcf?.assumptions}
            />

            {/* DDM Model */}
            <FairValueCard
              modelName="Dividend Discount Model"
              fairValue={ddm?.applicable ? ddm.fairValue : null}
              currentPrice={currentPrice}
              assumptions={ddm?.applicable ? ddm.assumptions : undefined}
            />

            {/* P/E Ratio */}
            <FairValueCard
              modelName="P/E Ratio"
              fairValue={relativeValue?.peRatioFairValue ?? null}
              currentPrice={currentPrice}
              assumptions={{
                companyPE: relativeValue?.companyMetrics?.pe,
                industryMedianPE: relativeValue?.industryMedians?.pe,
              }}
            />

            {/* Graham Number */}
            <FairValueCard
              modelName="Graham Number"
              fairValue={graham?.applicable ? graham.fairValue : null}
              currentPrice={currentPrice}
              assumptions={graham?.applicable ? graham.assumptions : undefined}
            />
          </div>
        </div>

        {/* Additional Relative Valuation Metrics - Requirements: 12.1, 12.2 */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Additional Metrics</h3>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* P/B Ratio */}
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">P/B Ratio Fair Value</h4>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                ${relativeValue?.pbRatioFairValue?.toFixed(2) ?? 'N/A'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Company P/B: {relativeValue?.companyMetrics?.pb?.toFixed(2) ?? 'N/A'} | 
                Industry Median: {relativeValue?.industryMedians?.pb?.toFixed(2) ?? 'N/A'}
              </div>
            </div>

            {/* P/S Ratio */}
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">P/S Ratio Fair Value</h4>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                ${relativeValue?.psRatioFairValue?.toFixed(2) ?? 'N/A'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Company P/S: {relativeValue?.companyMetrics?.ps?.toFixed(2) ?? 'N/A'} | 
                Industry Median: {relativeValue?.industryMedians?.ps?.toFixed(2) ?? 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
