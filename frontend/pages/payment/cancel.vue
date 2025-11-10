<template>
  <div class="min-h-screen bg-white flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <!-- Cancel Icon -->
      <div class="mb-6 flex justify-center">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
      </div>

      <!-- Cancel Message -->
      <h1 class="text-3xl font-bold text-gray-900 mb-3">
        {{ $t('payment.cancelled.title') }}
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        {{ $t('payment.cancelled.message') }}
      </p>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <button
          @click="navigateTo('/pricing')"
          class="w-full py-3 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          {{ $t('payment.cancelled.tryAgain') }}
        </button>
        <button
          @click="navigateTo('/')"
          class="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          {{ $t('payment.cancelled.goHome') }}
        </button>
      </div>

      <!-- Help Text -->
      <div class="mt-8 p-4 bg-gray-50 rounded-lg text-left">
        <p class="text-sm text-gray-600">
          {{ $t('pricing.questions') }}
          <a href="mailto:support@stockmeter.com" class="text-gray-900 underline hover:text-gray-700">
            {{ $t('pricing.contactUs') }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No special logic needed for cancel page
</script>
