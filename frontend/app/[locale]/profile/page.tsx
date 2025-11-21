'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserCircleIcon,
  CreditCardIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/composables/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import SubscriptionModal from '@/components/SubscriptionModal';
import CurrencySelector from '@/components/CurrencySelector';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001';

interface Transaction {
  id: string;
  provider: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isPro, checkAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile');
      return;
    }

    loadProfileData();
  }, [isAuthenticated, router]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);

      // Subscription status is available from user object

      // Load payment history
      const txResponse = await axios.get<Transaction[]>(
        `${API_BASE_URL}/api/user/transactions`,
        { withCredentials: true }
      );
      setTransactions(txResponse.data);

      // Set user preferences
      if (user) {
        setSelectedLanguage(user.languagePreference || 'en');
        setSelectedCurrency(user.currencyPreference || 'USD');
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading profile data:', error);
      setIsLoading(false);
      
      // If endpoints don't exist yet, just continue with user data
      if (user) {
        setSelectedLanguage(user.languagePreference || 'en');
        setSelectedCurrency(user.currencyPreference || 'USD');
      }
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);

      await axios.patch(
        `${API_BASE_URL}/api/user/preferences`,
        {
          languagePreference: selectedLanguage,
          currencyPreference: selectedCurrency,
        },
        { withCredentials: true }
      );

      // Refresh user data
      await checkAuth();

      toast.success('Preferences saved successfully');
      setIsSaving(false);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account, subscription, and preferences
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <UserCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.name}
                </h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                isPro
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isPro ? 'Pro Member' : 'Free Plan'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Member since</span>
              <p className="text-gray-900 font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Account ID</span>
              <p className="text-gray-900 font-mono text-xs">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <CreditCardIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Subscription
            </h2>
          </div>

          {isPro ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-green-900 mb-1">
                      Pro Plan Active
                    </p>
                    <p className="text-sm text-green-700">
                      You have access to all premium features
                    </p>
                  </div>
                  <CheckCircleIcon className="h-6 w-6 text-green-600 shrink-0" />
                </div>

                {user.subscriptionExpiry && (
                  <div className="text-sm text-green-800">
                    <span className="font-medium">Next billing date:</span>{' '}
                    {new Date(user.subscriptionExpiry).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700">
                    Detailed model breakdowns
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700">
                    Compare up to 50 stocks
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700">Unlimited watchlist</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700">Price alerts</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700">Export to CSV & PDF</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Free Plan
                    </p>
                    <p className="text-sm text-gray-600">
                      Upgrade to Pro for advanced features
                    </p>
                  </div>
                  <XCircleIcon className="h-6 w-6 text-gray-400 shrink-0" />
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                Upgrade to Pro
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            </div>
          )}
        </div>

        {/* Preferences Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Preferences
          </h2>

          <div className="space-y-6">
            {/* Language Preference */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Preference */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Currency
              </label>
              <CurrencySelector 
                currentCurrency={selectedCurrency}
                onCurrencyChange={(currency) => {
                  setSelectedCurrency(currency);
                  checkAuth(); // Refresh user data
                }}
              />
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="w-full bg-gray-900 text-white py-2 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Payment History Card */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {tx.plan}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {tx.currency} {tx.amount}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planType="monthly"
      />
    </div>
  );
}
