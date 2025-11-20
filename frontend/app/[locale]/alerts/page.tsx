'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AlertForm from '@/components/AlertForm';
import axios from 'axios';

interface Alert {
  id: string;
  ticker: string;
  thresholdType: 'undervalued' | 'overvalued' | 'fair';
  thresholdValue: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const apiBaseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001';

  // Check authentication and subscription status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/user/subscription`, {
          withCredentials: true,
        });
        
        setIsAuthenticated(true);
        setIsPro(response.data.data.status === 'pro');
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        router.push('/login');
      }
    };

    checkAuth();
  }, [apiBaseUrl, router]);

  // Load alerts
  const loadAlerts = async () => {
    if (!isPro) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get<{ data: Alert[] }>(`${apiBaseUrl}/api/alerts`, {
        withCredentials: true,
      });

      setAlerts(response.data.data);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
      setError(err.response?.data?.error?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isPro) {
      loadAlerts();
    } else if (isAuthenticated && !isPro) {
      setLoading(false);
    }
  }, [isAuthenticated, isPro]);

  // Toggle alert status
  const toggleAlertStatus = async (alert: Alert) => {
    const newStatus = alert.status === 'active' ? 'inactive' : 'active';

    try {
      await axios.patch(
        `${apiBaseUrl}/api/alerts/${alert.id}`,
        { status: newStatus },
        { withCredentials: true }
      );

      // Update local state
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      console.error('Error toggling alert status:', err);
      window.alert('Failed to update alert status');
    }
  };

  // Delete alert
  const deleteAlert = async (alert: Alert) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      await axios.delete(`${apiBaseUrl}/api/alerts/${alert.id}`, {
        withCredentials: true,
      });

      // Remove from local state
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    } catch (err: any) {
      console.error('Error deleting alert:', err);
      window.alert('Failed to delete alert');
    }
  };

  // Handle alert created
  const handleAlertCreated = () => {
    loadAlerts();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Requirements: 12.1, 12.2 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Price Alerts</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Get notified when stocks meet your valuation criteria
          </p>
        </div>

        {/* Upgrade Prompt for Free Users */}
        {!isPro && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pro Feature Required
              </h2>
              <p className="text-gray-600 mb-6">
                Price alerts are available exclusively for Pro subscribers. Upgrade now to get
                notified when stocks become undervalued or overvalued.
              </p>
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        )}

        {/* Alerts Content for Pro Users */}
        {isPro && (
          <>
            {/* Create Alert Button - Requirements: 12.1, 12.2 */}
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => setShowAlertForm(true)}
                className="w-full sm:w-auto px-6 py-3 min-h-touch bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Alert
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <svg
                  className="w-8 h-8 mx-auto text-gray-400 animate-spin"
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
                <p className="mt-4 text-gray-600">Loading alerts...</p>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="text-center">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={loadAlerts}
                    className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && alerts.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No alerts yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first alert to get notified when stocks meet your criteria
                </p>
                <button
                  onClick={() => setShowAlertForm(true)}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Alert
                </button>
              </div>
            )}

            {/* Alerts List - Requirements: 12.1, 12.2, 12.3 */}
            {!loading && !error && alerts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticker
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Threshold Type
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Threshold Value
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Created
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alerts.map((alert) => (
                        <tr key={alert.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/stocks/${alert.ticker}`}
                              className="text-sm font-semibold text-black hover:underline"
                            >
                              {alert.ticker}
                            </Link>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                alert.thresholdType === 'undervalued'
                                  ? 'bg-green-100 text-green-800'
                                  : alert.thresholdType === 'overvalued'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {alert.thresholdType.charAt(0).toUpperCase() +
                                alert.thresholdType.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {alert.thresholdValue}%
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                alert.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                            {formatDate(alert.createdAt)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle Active/Inactive - Requirements: 12.2 */}
                              <button
                                onClick={() => toggleAlertStatus(alert)}
                                className="p-2 min-w-touch min-h-touch text-gray-600 hover:text-gray-900 transition-colors"
                                title={
                                  alert.status === 'active' ? 'Deactivate' : 'Activate'
                                }
                              >
                                {alert.status === 'active' ? (
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                    />
                                  </svg>
                                )}
                              </button>

                              {/* Delete - Requirements: 12.2 */}
                              <button
                                onClick={() => deleteAlert(alert)}
                                className="p-2 min-w-touch min-h-touch text-red-600 hover:text-red-900 transition-colors"
                                title="Delete"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Alert Form Modal */}
      {showAlertForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAlertForm(false);
            }
          }}
        >
          <AlertForm
            onClose={() => setShowAlertForm(false)}
            onCreated={handleAlertCreated}
          />
        </div>
      )}
    </div>
  );
}
