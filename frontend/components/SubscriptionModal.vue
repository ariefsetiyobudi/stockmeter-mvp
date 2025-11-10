<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 relative my-8">
      <!-- Close Button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        :disabled="isProcessing"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Header -->
      <div class="mb-4 sm:mb-6">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {{ $t('payment.selectProvider') }}
        </h2>
        <p class="text-sm sm:text-base text-gray-600">
          {{ plan.type === 'monthly' ? $t('pricing.monthly') : $t('pricing.yearly') }} - 
          ${{ plan.price }}/{{ plan.type === 'monthly' ? $t('pricing.month') : $t('pricing.year') }}
        </p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <!-- Payment Provider Selection -->
      <div class="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <button
          v-for="provider in paymentProviders"
          :key="provider.id"
          @click="selectProvider(provider.id)"
          :disabled="isProcessing"
          :class="[
            'w-full p-3 sm:p-4 border-2 rounded-lg text-left transition-all tap-highlight-none min-h-touch',
            selectedProvider === provider.id
              ? 'border-gray-900 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300 active:border-gray-400',
            isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center min-w-0 flex-1">
              <div class="w-10 h-10 sm:w-12 sm:h-12 bg-white border border-gray-200 rounded flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <span class="text-base sm:text-lg font-bold text-gray-700">{{ provider.icon }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-medium text-sm sm:text-base text-gray-900">{{ provider.name }}</div>
                <div class="text-xs sm:text-sm text-gray-500 truncate">{{ provider.description }}</div>
              </div>
            </div>
            <div
              v-if="selectedProvider === provider.id"
              class="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center"
            >
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          @click="$emit('close')"
          :disabled="isProcessing"
          class="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tap-highlight-none min-h-touch text-sm sm:text-base"
        >
          {{ $t('payment.cancel') }}
        </button>
        <button
          @click="handleContinue"
          :disabled="!selectedProvider || isProcessing"
          class="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 active:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed tap-highlight-none min-h-touch text-sm sm:text-base"
        >
          {{ isProcessing ? $t('payment.processing') : $t('payment.continue') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

interface SubscriptionPlan {
  type: 'monthly' | 'yearly';
  price: number;
  currency: string;
}

interface Props {
  plan: SubscriptionPlan;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const config = useRuntimeConfig();
const authStore = useAuthStore();
const selectedProvider = ref<string>('');
const isProcessing = ref(false);
const error = ref<string>('');

const paymentProviders = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    description: 'Credit/Debit Card'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'PP',
    description: 'PayPal Account'
  },
  {
    id: 'midtrans',
    name: 'Midtrans',
    icon: 'MT',
    description: 'Indonesian Payment Methods'
  }
];

const selectProvider = (providerId: string) => {
  if (!isProcessing.value) {
    selectedProvider.value = providerId;
    error.value = '';
  }
};

const handleContinue = async () => {
  if (!selectedProvider.value || isProcessing.value) return;

  isProcessing.value = true;
  error.value = '';

  try {
    const response = await $fetch<{ checkoutUrl: string }>('/api/payments/subscribe', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      },
      body: {
        plan: props.plan.type,
        provider: selectedProvider.value
      },
      credentials: 'include'
    });

    // Redirect to payment provider checkout
    if (response.checkoutUrl) {
      window.location.href = response.checkoutUrl;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (err: any) {
    console.error('Subscription error:', err);
    error.value = err.data?.error?.message || 'Failed to initiate payment. Please try again.';
    isProcessing.value = false;
  }
};
</script>
