'use client';

import { XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Cancel Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircleIcon className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600">
            Your subscription was not completed
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              What happened?
            </h2>
            <p className="text-gray-600 mb-4">
              You cancelled the payment process or closed the payment window
              before completing your subscription. No charges were made to your
              account.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Need help?
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              If you experienced any issues during checkout or have questions
              about our pricing, we're here to help.
            </p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Check our FAQ section on the pricing page</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Contact support at support@stockmeter.com</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Try a different payment method</span>
              </li>
            </ul>
          </div>

          {/* Why Go Pro */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Why upgrade to Pro?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Detailed valuation model breakdowns</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Compare up to 50 stocks at once</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Unlimited watchlist capacity</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Real-time price alerts</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Export capabilities (CSV & PDF)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full bg-green-600 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="w-full bg-white text-gray-700 text-center py-3 px-6 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Alternative Options */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Not ready to upgrade yet?
          </p>
          <Link
            href="/"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Continue with Free Plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
