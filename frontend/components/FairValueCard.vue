<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow">
    <!-- Model Name -->
    <div class="flex items-center justify-between mb-3 sm:mb-4">
      <h3 class="text-base sm:text-lg font-semibold text-black">
        {{ modelName }}
      </h3>
      
      <!-- Info Icon for Tooltip -->
      <div class="relative group">
        <svg
          class="w-5 h-5 text-gray-400 cursor-help"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        
        <!-- Tooltip -->
        <div
          v-if="assumptions"
          class="absolute right-0 bottom-full mb-2 w-56 sm:w-64 p-2 sm:p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
        >
          <div class="font-semibold mb-2">Key Assumptions:</div>
          <div class="space-y-1">
            <div v-for="(value, key) in assumptions" :key="key" class="flex justify-between">
              <span class="text-gray-300">{{ formatAssumptionKey(key) }}:</span>
              <span class="font-medium">{{ formatAssumptionValue(key, value) }}</span>
            </div>
          </div>
          <div class="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      </div>
    </div>

    <!-- Fair Value -->
    <div v-if="fairValue !== null" class="mb-3 sm:mb-4">
      <div class="text-2xl sm:text-3xl font-bold text-black">
        {{ formatCurrency(convertedFairValue) }}
      </div>
      <div class="text-xs sm:text-sm text-gray-500 mt-1">
        Fair Value
      </div>
    </div>

    <!-- Not Applicable -->
    <div v-else class="mb-3 sm:mb-4">
      <div class="text-xl sm:text-2xl font-semibold text-gray-400">
        N/A
      </div>
      <div class="text-xs sm:text-sm text-gray-500 mt-1">
        Not applicable for this stock
      </div>
    </div>

    <!-- Valuation Status Badge -->
    <div v-if="fairValue !== null && currentPrice" class="mt-3 sm:mt-4">
      <div
        class="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
        :class="statusClasses"
      >
        <span class="w-2 h-2 rounded-full mr-1.5 sm:mr-2" :class="statusDotClasses"></span>
        {{ statusText }}
      </div>
      
      <!-- Price Difference -->
      <div class="mt-2 text-xs sm:text-sm text-gray-600">
        <span v-if="priceDifference > 0">
          {{ Math.abs(priceDifference).toFixed(1) }}% above current price
        </span>
        <span v-else-if="priceDifference < 0">
          {{ Math.abs(priceDifference).toFixed(1) }}% below current price
        </span>
        <span v-else>
          At current price
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useCurrency } from '~/composables/useCurrency';

interface Props {
  modelName: string;
  fairValue: number | null;
  currentPrice?: number;
  assumptions?: Record<string, any>;
}

const props = defineProps<Props>();
const { convertToUserCurrency, formatCurrency: formatCurrencyUtil, userCurrency } = useCurrency();

const convertedFairValue = ref<number | null>(null);
const convertedCurrentPrice = ref<number | null>(null);

onMounted(async () => {
  if (props.fairValue !== null) {
    convertedFairValue.value = await convertToUserCurrency(props.fairValue);
  }
  if (props.currentPrice) {
    convertedCurrentPrice.value = await convertToUserCurrency(props.currentPrice);
  }
});

// Calculate price difference percentage
const priceDifference = computed(() => {
  if (!convertedFairValue.value || !convertedCurrentPrice.value) return 0;
  return ((convertedFairValue.value - convertedCurrentPrice.value) / convertedCurrentPrice.value) * 100;
});

// Determine valuation status
const valuationStatus = computed(() => {
  if (!convertedFairValue.value || !convertedCurrentPrice.value) return 'fair';
  
  const diff = priceDifference.value;
  if (diff >= 10) return 'undervalued';
  if (diff <= -10) return 'overvalued';
  return 'fair';
});

// Status text
const statusText = computed(() => {
  switch (valuationStatus.value) {
    case 'undervalued':
      return 'Undervalued';
    case 'overvalued':
      return 'Overvalued';
    default:
      return 'Fairly Priced';
  }
});

// Status badge classes (soft colors)
const statusClasses = computed(() => {
  switch (valuationStatus.value) {
    case 'undervalued':
      return 'bg-green-50 text-green-700 border border-green-200';
    case 'overvalued':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border border-gray-200';
  }
});

// Status dot classes
const statusDotClasses = computed(() => {
  switch (valuationStatus.value) {
    case 'undervalued':
      return 'bg-green-500';
    case 'overvalued':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
});

// Format currency
const formatCurrency = (value: number | null): string => {
  if (value === null) return 'N/A';
  return formatCurrencyUtil(value, userCurrency.value);
};

// Format assumption key (convert camelCase to readable)
const formatAssumptionKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// Format assumption value
const formatAssumptionValue = (key: string, value: any): string => {
  if (typeof value === 'number') {
    // Check if it's a percentage (rate, growth, etc.)
    if (key.toLowerCase().includes('rate') || 
        key.toLowerCase().includes('growth') || 
        key.toLowerCase().includes('wacc')) {
      return `${(value * 100).toFixed(2)}%`;
    }
    // Check if it's a year count
    if (key.toLowerCase().includes('years')) {
      return `${value} years`;
    }
    // Otherwise format as number
    return value.toFixed(2);
  }
  return String(value);
};
</script>
