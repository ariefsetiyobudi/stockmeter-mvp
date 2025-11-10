<template>
  <div class="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
    <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{{ $t('alerts.createAlert') }}</h2>
    
    <form @submit.prevent="handleSubmit">
      <!-- Ticker Input with Autocomplete -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ $t('alerts.ticker') }}
        </label>
        <div class="relative">
          <input
            v-model="form.ticker"
            type="text"
            :placeholder="$t('alerts.tickerPlaceholder')"
            class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent tap-highlight-none text-sm sm:text-base"
            :class="{ 'border-red-500': errors.ticker }"
            @input="handleTickerInput"
            @focus="showTickerDropdown = true"
            @blur="handleTickerBlur"
            required
          />
          
          <!-- Autocomplete Dropdown -->
          <div
            v-if="showTickerDropdown && tickerResults.length > 0"
            class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            <div
              v-for="result in tickerResults"
              :key="result.ticker"
              class="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              @mousedown.prevent="selectTicker(result)"
            >
              <div class="font-semibold text-sm">{{ result.ticker }}</div>
              <div class="text-xs text-gray-600 truncate">{{ result.name }}</div>
            </div>
          </div>
        </div>
        <p v-if="errors.ticker" class="mt-1 text-sm text-red-600">{{ errors.ticker }}</p>
      </div>

      <!-- Threshold Type Selection -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ $t('alerts.thresholdType') }}
        </label>
        <select
          v-model="form.thresholdType"
          class="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent tap-highlight-none text-sm sm:text-base"
          :class="{ 'border-red-500': errors.thresholdType }"
          required
        >
          <option value="">{{ $t('alerts.selectType') }}</option>
          <option value="undervalued">{{ $t('alerts.undervalued') }}</option>
          <option value="overvalued">{{ $t('alerts.overvalued') }}</option>
          <option value="fair">{{ $t('alerts.fair') }}</option>
        </select>
        <p v-if="errors.thresholdType" class="mt-1 text-sm text-red-600">{{ errors.thresholdType }}</p>
      </div>

      <!-- Threshold Value Input -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ $t('alerts.thresholdValue') }}
        </label>
        <div class="relative">
          <input
            v-model.number="form.thresholdValue"
            type="number"
            min="0"
            max="100"
            step="1"
            :placeholder="$t('alerts.thresholdPlaceholder')"
            class="w-full px-3 sm:px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent tap-highlight-none text-sm sm:text-base"
            :class="{ 'border-red-500': errors.thresholdValue }"
            required
          />
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
        </div>
        <p v-if="errors.thresholdValue" class="mt-1 text-sm text-red-600">{{ errors.thresholdValue }}</p>
        <p class="mt-1 text-xs text-gray-500">{{ $t('alerts.thresholdHelp') }}</p>
      </div>

      <!-- Error Message -->
      <div v-if="submitError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-600">{{ submitError }}</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          type="button"
          @click="handleCancel"
          class="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors tap-highlight-none min-h-touch text-sm sm:text-base"
          :disabled="isSubmitting"
        >
          {{ $t('alerts.cancel') }}
        </button>
        <button
          type="submit"
          class="flex-1 px-4 py-2 sm:py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tap-highlight-none min-h-touch text-sm sm:text-base"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? $t('alerts.creating') : $t('alerts.create') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { StockSearchResult } from '~/types';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const config = useRuntimeConfig();
const { searchStocks, searchResults, clearSearch } = useStockData();

// Form state
const form = reactive({
  ticker: '',
  thresholdType: '',
  thresholdValue: 10,
});

// Validation errors
const errors = reactive({
  ticker: '',
  thresholdType: '',
  thresholdValue: '',
});

// UI state
const isSubmitting = ref(false);
const submitError = ref('');
const showTickerDropdown = ref(false);
const tickerResults = ref<StockSearchResult[]>([]);

// Handle ticker input with autocomplete
const handleTickerInput = () => {
  errors.ticker = '';
  
  if (form.ticker.length >= 2) {
    searchStocks(form.ticker);
    tickerResults.value = [...searchResults.value];
    showTickerDropdown.value = true;
  } else {
    tickerResults.value = [];
    showTickerDropdown.value = false;
  }
};

// Select ticker from autocomplete
const selectTicker = (result: StockSearchResult) => {
  form.ticker = result.ticker;
  showTickerDropdown.value = false;
  tickerResults.value = [];
  clearSearch();
};

// Handle ticker blur
const handleTickerBlur = () => {
  setTimeout(() => {
    showTickerDropdown.value = false;
  }, 200);
};

// Validate form
const validateForm = (): boolean => {
  let isValid = true;
  
  // Reset errors
  errors.ticker = '';
  errors.thresholdType = '';
  errors.thresholdValue = '';
  
  // Validate ticker
  if (!form.ticker || form.ticker.length === 0) {
    errors.ticker = 'Ticker is required';
    isValid = false;
  } else if (form.ticker.length > 10) {
    errors.ticker = 'Ticker must be 10 characters or less';
    isValid = false;
  }
  
  // Validate threshold type
  if (!form.thresholdType) {
    errors.thresholdType = 'Threshold type is required';
    isValid = false;
  }
  
  // Validate threshold value
  if (form.thresholdValue === null || form.thresholdValue === undefined) {
    errors.thresholdValue = 'Threshold value is required';
    isValid = false;
  } else if (form.thresholdValue < 0 || form.thresholdValue > 100) {
    errors.thresholdValue = 'Threshold value must be between 0 and 100';
    isValid = false;
  }
  
  return isValid;
};

// Handle form submission
const handleSubmit = async () => {
  submitError.value = '';
  
  if (!validateForm()) {
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    const authStore = useAuthStore();
    
    await $fetch('/api/alerts', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: {
        ticker: form.ticker.toUpperCase(),
        thresholdType: form.thresholdType,
        thresholdValue: form.thresholdValue,
      },
      credentials: 'include',
    });
    
    // Emit success event
    emit('created');
    emit('close');
  } catch (error: any) {
    console.error('Error creating alert:', error);
    
    if (error.data?.error?.message) {
      submitError.value = error.data.error.message;
    } else {
      submitError.value = 'Failed to create alert. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  emit('close');
};
</script>
