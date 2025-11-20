'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/composables/useAuth';
import SubscriptionModal from '@/components/SubscriptionModal';

type PlanType = 'monthly' | 'yearly';

interface PricingPlan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const freePlan: PricingPlan = {
  name: 'Free',
  price: 0,
  period: 'forever',
  description: 'Perfect for getting started with stock valuation',
  features: [
    'Search global stocks',
    'View current prices',
    'Basic fair value calculations (4 models)',
    'Single stock analysis',
    'Up to 5 stocks in watchlist',
    'Community support',
  ],
};

const proPlanMonthly: PricingPlan = {
  name: 'Pro',
  price: 12,
  period: 'month',
  description: 'For serious investors who need advanced features',
  features: [
    'Everything in Free',
    'Detailed model breakdowns',
    'Batch comparison (up to 50 stocks)',
    'Unlimited watchlist',
    'Price alerts & notifications',
    'Export to CSV & PDF',
    'Priority support',
    'Advanced analytics',
  ],
  highlighted: true,
};

const proPlanYearly: PricingPlan = {
  name: 'Pro',
  price: 99,
  period: 'year',
  description: 'For serious investors who need advanced features',
  features: [
    'Everything in Free',
    'Detailed model breakdowns',
    'Batch comparison (up to 50 stocks)',
    'Unlimited watchlist',
    'Price alerts & notifications',
    'Export to CSV & PDF',
    'Priority support',
    'Advanced analytics',
    '2 months free (save $45)',
  ],
  highlighted: true,
};

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, isPro } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<PlanType>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');

  const proPlan = billingPeriod === 'monthly' ? proPlanMonthly : proPlanYearly;

  const handleSubscribe = (planType: PlanType) => {
    if (!isAuthenticated) {
      // Redirect to register with return URL
      router.push(`/register?redirect=/pricing&plan=${planType}`);
      return;
    }

    // Open subscription modal
    setSelectedPlan(planType);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Requirements: 12.1, 12.2 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your investment strategy
          </p>
        </div>

        {/* Billing Period Toggle - Requirements: 12.1, 12.2 */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex w-full max-w-xs sm:w-auto">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 min-h-touch rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 min-h-touch rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-600 font-semibold">
                Save 31%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards - Requirements: 12.1, 12.2 */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 sm:p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {freePlan.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {freePlan.description}
              </p>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">
                  ${freePlan.price}
                </span>
                <span className="ml-2 text-gray-600">/{freePlan.period}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              {freePlan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => router.push('/register')}
              disabled={isAuthenticated}
              className={`w-full py-3 px-6 min-h-touch rounded-lg font-medium transition-colors ${
                isAuthenticated
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {isAuthenticated ? 'Current Plan' : 'Get Started'}
            </button>
          </div>

          {/* Pro Plan */}
          <div
            className={`bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col relative ${
              proPlan.highlighted
                ? 'border-2 border-green-500 ring-4 ring-green-100'
                  : 'border-2 border-gray-200'
            }`}
          >
            {proPlan.highlighted && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {proPlan.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {proPlan.description}
              </p>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">
                  ${proPlan.price}
                </span>
                <span className="ml-2 text-gray-600">/{proPlan.period}</span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Billed annually at ${proPlan.price}
                </p>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-grow">
              {proPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(billingPeriod)}
              disabled={isPro}
              className={`w-full py-3 px-6 min-h-touch rounded-lg font-medium transition-colors ${
                isPro
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isPro ? 'Current Plan' : 'Subscribe Now'}
            </button>
          </div>
        </div>

        {/* FAQ Section - Requirements: 12.1, 12.2 */}
        <div className="mt-12 sm:mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I switch plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade from Free to Pro at any time. If you're on
                a monthly plan, you can switch to yearly to save money.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards through Stripe, PayPal, and
                Midtrans for international payments.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial for Pro?
              </h3>
              <p className="text-gray-600">
                While we don't offer a free trial, our Free plan gives you full
                access to our core valuation features so you can try before you
                upgrade.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time from your
                profile page. You'll continue to have Pro access until the end
                of your billing period.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section - Requirements: 12.1, 12.2 */}
        <div className="mt-12 sm:mt-20 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to make smarter investment decisions?
          </h2>
          <p className="text-green-100 text-sm sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of investors using Stockmeter to find undervalued
            stocks and maximize returns.
          </p>
          <button
            onClick={() => handleSubscribe(billingPeriod)}
            className="w-full sm:w-auto bg-white text-green-600 px-6 sm:px-8 py-3 sm:py-4 min-h-touch rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-50 transition-colors shadow-xl"
          >
            Start Your Pro Subscription
          </button>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planType={selectedPlan}
      />
    </div>
  );
}
