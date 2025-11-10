<template>
  <div class="min-h-screen bg-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8 sm:mb-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          {{ $t('pricing.title') }}
        </h1>
        <p class="text-lg sm:text-xl text-gray-600">
          {{ $t('pricing.subtitle') }}
        </p>
      </div>

      <!-- Billing Toggle -->
      <div class="flex justify-center mb-8 sm:mb-12">
        <div class="bg-gray-100 p-1 rounded-lg inline-flex w-full max-w-xs sm:w-auto">
          <button
            @click="billingPeriod = 'monthly'"
            :class="[
              'flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors tap-highlight-none',
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 active:text-black'
            ]"
          >
            {{ $t('pricing.monthly') }}
          </button>
          <button
            @click="billingPeriod = 'yearly'"
            :class="[
              'flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors tap-highlight-none',
              billingPeriod === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 active:text-black'
            ]"
          >
            {{ $t('pricing.yearly') }}
            <span class="ml-1 text-green-600 text-xs">{{ $t('pricing.save') }}</span>
          </button>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
        <!-- Free Tier -->
        <div class="border-2 border-gray-200 rounded-lg p-6 sm:p-8 bg-white">
          <div class="mb-4 sm:mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {{ $t('pricing.free.title') }}
            </h2>
            <div class="flex items-baseline">
              <span class="text-3xl sm:text-4xl font-bold text-gray-900">$0</span>
              <span class="text-sm sm:text-base text-gray-600 ml-2">/{{ $t('pricing.forever') }}</span>
            </div>
          </div>

          <ul class="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.free.feature1') }}</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.free.feature2') }}</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.free.feature3') }}</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.free.feature4') }}</span>
            </li>
          </ul>

          <button
            v-if="!isAuthenticated"
            @click="navigateTo('/register')"
            class="w-full py-2.5 sm:py-3 px-4 sm:px-6 border-2 border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors tap-highlight-none min-h-touch text-sm sm:text-base"
          >
            {{ $t('pricing.getStarted') }}
          </button>
          <div v-else class="w-full py-2.5 sm:py-3 px-4 sm:px-6 text-center text-gray-600 font-medium text-sm sm:text-base">
            {{ $t('pricing.currentPlan') }}
          </div>
        </div>

        <!-- Pro Tier -->
        <div class="border-2 border-gray-900 rounded-lg p-6 sm:p-8 bg-gray-50 relative">
          <div class="absolute top-0 right-0 bg-green-500 text-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-bl-lg rounded-tr-lg text-xs sm:text-sm font-medium">
            {{ $t('pricing.popular') }}
          </div>

          <div class="mb-4 sm:mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {{ $t('pricing.pro.title') }}
            </h2>
            <div class="flex items-baseline">
              <span class="text-3xl sm:text-4xl font-bold text-gray-900">
                ${{ billingPeriod === 'monthly' ? '12' : '99' }}
              </span>
              <span class="text-sm sm:text-base text-gray-600 ml-2">
                /{{ billingPeriod === 'monthly' ? $t('pricing.month') : $t('pricing.year') }}
              </span>
            </div>
            <p v-if="billingPeriod === 'yearly'" class="text-xs sm:text-sm text-green-600 mt-1">
              {{ $t('pricing.yearlyDiscount') }}
            </p>
          </div>

          <ul class="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700 font-medium">{{ $t('pricing.pro.feature1') }}</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.pro.feature2') }}</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.pro.feature3') }}</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.pro.feature4') }}</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.pro.feature5') }}</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-700">{{ $t('pricing.pro.feature6') }}</span>
            </li>
          </ul>

          <button
            v-if="!isPro"
            @click="handleSubscribe"
            class="w-full py-2.5 sm:py-3 px-4 sm:px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 active:bg-black transition-colors tap-highlight-none min-h-touch text-sm sm:text-base"
          >
            {{ $t('pricing.subscribe') }}
          </button>
          <div v-else class="w-full py-2.5 sm:py-3 px-4 sm:px-6 text-center text-gray-900 font-medium text-sm sm:text-base">
            {{ $t('pricing.currentPlan') }}
          </div>
        </div>
      </div>

      <!-- FAQ or Additional Info -->
      <div class="mt-12 sm:mt-16 text-center px-4">
        <p class="text-sm sm:text-base text-gray-600">
          {{ $t('pricing.questions') }}
          <a href="mailto:support@stockmeter.com" class="text-gray-900 underline hover:text-gray-700">
            {{ $t('pricing.contactUs') }}
          </a>
        </p>
      </div>
    </div>

    <!-- Subscription Modal -->
    <SubscriptionModal
      v-if="showModal"
      :plan="selectedPlan"
      @close="showModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';

const { isAuthenticated, isPro } = useAuth();
const billingPeriod = ref<'monthly' | 'yearly'>('monthly');
const showModal = ref(false);

const selectedPlan = computed(() => ({
  type: billingPeriod.value,
  price: billingPeriod.value === 'monthly' ? 12 : 99,
  currency: 'USD'
}));

const handleSubscribe = () => {
  if (!isAuthenticated.value) {
    navigateTo('/register');
  } else {
    showModal.value = true;
  }
};
</script>
