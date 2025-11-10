<template>
  <div class="relative w-full">
    <!-- Search Input -->
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search stocks by ticker or company name..."
        class="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent tap-highlight-none"
        @input="handleInput"
        @focus="showDropdown = true"
        @blur="handleBlur"
      />
      
      <!-- Search Icon / Loading Spinner -->
      <div class="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
        <svg
          v-if="!searchLoading"
          class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        
        <svg
          v-else
          class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>

    <!-- Autocomplete Dropdown -->
    <div
      v-if="showDropdown && (searchResults.length > 0 || searchError)"
      class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 sm:max-h-96 overflow-y-auto"
    >
      <!-- Error Message -->
      <div
        v-if="searchError"
        class="px-4 py-3 text-sm text-red-600"
      >
        {{ searchError }}
      </div>

      <!-- Search Results -->
      <div
        v-for="result in searchResults"
        :key="result.ticker"
        class="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors tap-highlight-none min-h-touch"
        @mousedown.prevent="handleSelect(result)"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm sm:text-base text-gray-900">
              {{ result.ticker }}
            </div>
            <div class="text-xs sm:text-sm text-gray-600 truncate">
              {{ result.name }}
            </div>
          </div>
          <div class="ml-2 sm:ml-4 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
            {{ result.exchange }}
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div
        v-if="!searchError && searchResults.length === 0 && searchQuery.length >= 2"
        class="px-4 py-3 text-sm text-gray-500"
      >
        No stocks found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { StockSearchResult } from '~/types';

const router = useRouter();
const { searchStocks, searchResults, searchLoading, searchError, clearSearch } = useStockData();

const searchQuery = ref('');
const showDropdown = ref(false);

const handleInput = () => {
  if (searchQuery.value.length >= 2) {
    searchStocks(searchQuery.value);
    showDropdown.value = true;
  } else {
    clearSearch();
    showDropdown.value = false;
  }
};

const handleSelect = (result: StockSearchResult) => {
  searchQuery.value = '';
  showDropdown.value = false;
  clearSearch();
  
  // Navigate to stock detail page
  router.push(`/stocks/${result.ticker}`);
};

const handleBlur = () => {
  // Delay to allow click event to fire
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

// Watch for route changes to clear search
watch(() => router.currentRoute.value.path, () => {
  searchQuery.value = '';
  clearSearch();
});
</script>
