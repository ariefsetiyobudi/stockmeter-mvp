'use client';

import { use } from 'react';
import Link from 'next/link';
import { useModelDetails } from '@/hooks/useStockData';
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface ModelDetailsPageProps {
  params: Promise<{ ticker: string }>;
}

/**
 * Model details page showing detailed calculation steps (Pro only)
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export default function ModelDetailsPage({ params }: ModelDetailsPageProps) {
  const { ticker } = use(params);
  const tickerUpper = ticker.toUpperCase();

  // TODO: Get user subscription status from auth store
  const isPro = false; // This should come from auth store

  // Fetch model details
  const {
    data: modelDetails,
    isLoading,
    error,
  } = useModelDetails(tickerUpper);

  // Show upgrade prompt for free users (Requirements: 3.1)
  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link
            href={`/stocks/${tickerUpper}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Stock Detail
          </Link>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockClosedIcon className="w-8 h-8 text-yellow-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Pro Feature
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Detailed model breakdowns with calculation steps, assumptions, and projected cash flows are available for Pro subscribers.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">What you'll get with Pro:</h3>
                <ul className="text-left space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Complete DCF calculation with 10-year projections</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Detailed assumptions and methodology</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Historical financial data analysis</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Sensitivity analysis and scenarios</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Plus batch comparison, alerts, and exports</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/pricing"
                  className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Upgrade to Pro
                </Link>
                <Link
                  href={`/stocks/${tickerUpper}`}
                  className="px-8 py-3 bg-white text-gray-900 border border-gray-300 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Stock
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link
            href={`/stocks/${tickerUpper}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Stock Detail
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Model Details</h2>
            <p className="text-red-600">{error.message || 'Failed to load model details'}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!modelDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link
            href={`/stocks/${tickerUpper}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Stock Detail
          </Link>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Data Available</h2>
            <p className="text-yellow-600">Model details not found for {tickerUpper}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href={`/stocks/${tickerUpper}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Stock Detail
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Detailed Model Breakdown
          </h1>
          <p className="text-lg text-gray-600">{tickerUpper}</p>
        </div>

        {/* DCF Model Details (Requirements: 3.2, 3.3, 3.4) */}
        {modelDetails.dcf && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">DCF Model</h2>
            
            {/* Assumptions (Requirements: 3.3) */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Assumptions</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(modelDetails.dcf.assumptions || {}).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {typeof value === 'number' && key.toLowerCase().includes('rate')
                        ? `${(value * 100).toFixed(2)}%`
                        : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projected Cash Flows (Requirements: 3.4, 3.5) */}
            {modelDetails.dcf.projectedCashFlows && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Projected Cash Flows (10 Years)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Projected FCF
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount Factor
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modelDetails.dcf.projectedCashFlows.map((cf: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            Year {index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            ${(cf.cashFlow / 1e6).toFixed(2)}M
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {cf.discountFactor?.toFixed(4) || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            ${(cf.presentValue / 1e6).toFixed(2)}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Calculation Summary */}
            {modelDetails.dcf.summary && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Summary</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(modelDetails.dcf.summary).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {typeof value === 'number' ? `$${value.toFixed(2)}` : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other Model Details */}
        {modelDetails.ddm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Dividend Discount Model
            </h2>
            <p className="text-gray-600">
              Detailed DDM calculations and assumptions...
            </p>
          </div>
        )}

        {/* Methodology */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Methodology Note</h3>
          <p className="text-blue-800 text-sm">
            All calculations are based on publicly available financial data and industry-standard valuation methodologies. 
            Past performance does not guarantee future results. This analysis is for informational purposes only and 
            should not be considered investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}
