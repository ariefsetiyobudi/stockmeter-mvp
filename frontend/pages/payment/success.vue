<template>
  <div class="min-h-screen bg-white flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <!-- Success Icon -->
      <div class="mb-6 flex justify-center">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>

      <!-- Success Message -->
      <h1 class="text-3xl font-bold text-gray-900 mb-3">
        {{ $t('payment.success.title') }}
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        {{ $t('payment.success.message') }}
      </p>

      <!-- Loading State -->
      <div v-if="isUpdating" class="mb-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p class="text-sm text-gray-600 mt-2">{{ $t('payment.processing') }}</p>
      </div>

      <!-- Action Buttons -->
      <div v-else class="space-y-3">
        <button
          @click="navigateTo('/')"
          class="w-full py-3 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          {{ $t('payment.success.goToDashboard') }}
        </button>
        <button
          @click="navigateTo('/profile')"
          class="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          {{ $t('payment.success.viewProfile') }}
        </button>
      </div>

      <!-- Subscription Details -->
      <div v-if="user && !isUpdating" class="mt-8 p-4 bg-gray-50 rounded-lg text-left">
        <h3 class="font-medium text-gray-900 mb-2">{{ $t('profile.subscription') }}</h3>
        <div class="space-y-1 text-sm text-gray-600">
          <div class="flex justify-between">
            <span>{{ $t('profile.status') }}:</span>
            <span class="font-medium text-green-600">{{ $t('profile.pro') }}</span>
          </div>
          <div v-if="user.subscriptionExpiry" class="flex justify-between">
            <span>{{ $t('profile.renewsOn') }}:</span>
            <span class="font-medium">{{ formatDate(user.subscriptionExpiry) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';

const { user, refreshToken } = useAuth();
const isUpdating = ref(true);

const formatDate = (date: Date | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

onMounted(async () => {
  // Refresh user data to get updated subscription status
  try {
    await refreshToken();
  } catch (error) {
    console.error('Failed to refresh user data:', error);
  } finally {
    isUpdating.value = false;
  }
});
</script>
