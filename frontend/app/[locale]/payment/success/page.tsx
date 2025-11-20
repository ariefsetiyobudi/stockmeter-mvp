'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/composables/useAuth';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const { checkAuth, user, isPro } = useAuth();
  const [isUpdating, setIsUpdating] = useState(true);

  // Get session ID from query params (if provided by payment provider)
  const sessionId = searchParams?.get('session_id') || null;
  const planType = searchParams?.get('plan') || null;

  useEffect(() => {
    // Refresh user data to get updated subscription status
    const updateSubscriptionStatus = async () => {
      try {
        // Wait a moment for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Refresh auth state
        await checkAuth();
        
        setIsUpdating(false);
      } catch (error) {
        console.error('Error updating subscription status:', error);
        setIsUpdating(false);
      }
    };

    updateSubscriptionStatus();
  }, [checkAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Thank you for subscribing to Stockmeter Pro
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {isUpdating ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">
                Activating your Pro subscription...
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Status</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  {isPro ? 'Active' : 'Processing'}
                </span>
              </div>

              {user && (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan</span>
                      <span className="text-gray-900 font-medium">
                        Stockmeter Pro {planType === 'yearly' ? 'Yearly' : 'Monthly'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="text-gray-900 font-medium">
                        {user.email}
                      </span>
                    </div>
                    {user.subscriptionExpiry && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Billing</span>
                        <span className="text-gray-900 font-medium">
                          {new Date(user.subscriptionExpiry).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {sessionId && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-xs text-gray-600 mb-1">
                        Transaction ID
                      </p>
                      <p className="text-sm text-gray-900 font-mono break-all">
                        {sessionId}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* What's Next */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-900 mb-2">
                  What's included in your Pro plan:
                </h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Detailed model breakdowns with all assumptions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Compare up to 50 stocks side-by-side</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited watchlist stocks</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Price alerts & email notifications</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Export data to CSV & PDF</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-green-600 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Start Analyzing Stocks
          </Link>
          <Link
            href="/profile"
            className="block w-full bg-white text-gray-700 text-center py-3 px-6 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            View Profile & Settings
          </Link>
        </div>

        {/* Receipt Notice */}
        <p className="text-center text-sm text-gray-600 mt-6">
          A receipt has been sent to your email address.
        </p>
      </div>
    </div>
  );
}
