'use client';

import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001';

type PlanType = 'monthly' | 'yearly';
type PaymentProvider = 'stripe' | 'paypal' | 'midtrans';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: PlanType;
}

interface PaymentProviderOption {
  id: PaymentProvider;
  name: string;
  description: string;
  logo: string;
  supported: boolean;
}

const paymentProviders: PaymentProviderOption[] = [
  {
    id: 'stripe',
    name: 'Credit Card',
    description: 'Pay securely with Stripe',
    logo: '💳',
    supported: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    logo: '🅿️',
    supported: true,
  },
  {
    id: 'midtrans',
    name: 'Midtrans',
    description: 'Indonesian payment methods',
    logo: '🇮🇩',
    supported: true,
  },
];

export default function SubscriptionModal({
  isOpen,
  onClose,
  planType,
}: SubscriptionModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  const planDetails = {
    monthly: {
      name: 'Pro Monthly',
      price: 12,
      period: 'month',
      description: 'Billed monthly, cancel anytime',
    },
    yearly: {
      name: 'Pro Yearly',
      price: 99,
      period: 'year',
      description: 'Billed annually, save $45',
    },
  };

  const plan = planDetails[planType];

  const handleSubscribe = async () => {
    setIsProcessing(true);

    try {
      // Call backend API to create subscription
      const response = await axios.post(
        `${API_BASE_URL}/api/payments/subscribe`,
        {
          plan: planType,
          provider: selectedProvider,
        },
        {
          withCredentials: true,
        }
      );

      const { checkoutUrl } = response.data;

      // Redirect to payment provider checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      const errorMessage =
        error.response?.data?.error?.message ||
        'Failed to initiate subscription. Please try again.';
      
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment as any}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment as any}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment as any}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900"
                  >
                    Subscribe to {plan.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Plan Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Plan</span>
                    <span className="text-gray-900 font-semibold">
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Price</span>
                    <span className="text-gray-900 font-semibold">
                      ${plan.price}/{plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {plan.description}
                  </p>
                </div>

                {/* Payment Provider Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Payment Method
                  </label>
                  <div className="space-y-3">
                    {paymentProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        disabled={!provider.supported || isProcessing}
                        className={`w-full flex items-center p-4 rounded-lg border-2 transition-all ${
                          selectedProvider === provider.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        } ${
                          !provider.supported || isProcessing
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <span className="text-3xl mr-4">{provider.logo}</span>
                        <div className="flex-grow text-left">
                          <div className="font-semibold text-gray-900">
                            {provider.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {provider.description}
                          </div>
                        </div>
                        {selectedProvider === provider.id && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-blue-800">
                    🔒 Your payment is secure and encrypted. We never store your
                    credit card information.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Continue to Payment'
                    )}
                  </button>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  By subscribing, you agree to our Terms of Service and Privacy
                  Policy. You can cancel anytime from your profile.
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
