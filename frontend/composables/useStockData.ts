import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type {
  StockSearchResult,
  StockDetail,
  FairValueResult,
  ModelDetails,
} from '~/types';

export const useStockData = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  // State
  const searchResults = ref<StockSearchResult[]>([]);
  const searchLoading = ref(false);
  const searchError = ref<string | null>(null);

  const stockDetail = ref<StockDetail | null>(null);
  const detailLoading = ref(false);
  const detailError = ref<string | null>(null);

  const fairValue = ref<FairValueResult | null>(null);
  const fairValueLoading = ref(false);
  const fairValueError = ref<string | null>(null);

  const modelDetails = ref<ModelDetails | null>(null);
  const modelDetailsLoading = ref(false);
  const modelDetailsError = ref<string | null>(null);

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    if (authStore.accessToken) {
      headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return headers;
  };

  // Search stocks with debouncing (300ms)
  const searchStocksImmediate = async (query: string): Promise<void> => {
    if (!query || query.length < 2) {
      searchResults.value = [];
      return;
    }

    searchLoading.value = true;
    searchError.value = null;

    try {
      const results = await $fetch<StockSearchResult[]>('/api/stocks/search', {
        baseURL: config.public.apiBaseUrl,
        method: 'GET',
        params: { q: query },
        headers: getAuthHeaders(),
      });

      searchResults.value = results;
    } catch (error: any) {
      console.error('Search error:', error);
      searchError.value = error.data?.error?.message || 'Failed to search stocks';
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  };

  // Debounced version of search
  const searchStocks = useDebounceFn(searchStocksImmediate, 300);

  // Get stock detail (profile + price)
  const getStockDetail = async (ticker: string): Promise<void> => {
    detailLoading.value = true;
    detailError.value = null;
    stockDetail.value = null;

    try {
      const profile = await $fetch(`/api/stocks/${ticker}`, {
        baseURL: config.public.apiBaseUrl,
        method: 'GET',
        headers: getAuthHeaders(),
      });

      stockDetail.value = profile as StockDetail;
    } catch (error: any) {
      console.error('Stock detail error:', error);
      detailError.value = error.data?.error?.message || 'Failed to fetch stock details';
    } finally {
      detailLoading.value = false;
    }
  };

  // Get fair value calculation
  const getFairValue = async (ticker: string): Promise<void> => {
    fairValueLoading.value = true;
    fairValueError.value = null;
    fairValue.value = null;

    try {
      const result = await $fetch<FairValueResult>(`/api/stocks/${ticker}/fairvalue`, {
        baseURL: config.public.apiBaseUrl,
        method: 'GET',
        headers: getAuthHeaders(),
      });

      fairValue.value = result;
    } catch (error: any) {
      console.error('Fair value error:', error);
      fairValueError.value = error.data?.error?.message || 'Failed to calculate fair value';
    } finally {
      fairValueLoading.value = false;
    }
  };

  // Get model details (Pro only)
  const getModelDetails = async (ticker: string): Promise<void> => {
    modelDetailsLoading.value = true;
    modelDetailsError.value = null;
    modelDetails.value = null;

    try {
      const result = await $fetch<ModelDetails>(`/api/stocks/${ticker}/modeldetails`, {
        baseURL: config.public.apiBaseUrl,
        method: 'GET',
        headers: getAuthHeaders(),
      });

      modelDetails.value = result;
    } catch (error: any) {
      console.error('Model details error:', error);
      modelDetailsError.value = error.data?.error?.message || 'Failed to fetch model details';
    } finally {
      modelDetailsLoading.value = false;
    }
  };

  // Clear search results
  const clearSearch = () => {
    searchResults.value = [];
    searchError.value = null;
  };

  // Clear stock detail
  const clearStockDetail = () => {
    stockDetail.value = null;
    detailError.value = null;
  };

  // Clear fair value
  const clearFairValue = () => {
    fairValue.value = null;
    fairValueError.value = null;
  };

  // Clear model details
  const clearModelDetails = () => {
    modelDetails.value = null;
    modelDetailsError.value = null;
  };

  return {
    // Search state
    searchResults: readonly(searchResults),
    searchLoading: readonly(searchLoading),
    searchError: readonly(searchError),

    // Stock detail state
    stockDetail: readonly(stockDetail),
    detailLoading: readonly(detailLoading),
    detailError: readonly(detailError),

    // Fair value state
    fairValue: readonly(fairValue),
    fairValueLoading: readonly(fairValueLoading),
    fairValueError: readonly(fairValueError),

    // Model details state
    modelDetails: readonly(modelDetails),
    modelDetailsLoading: readonly(modelDetailsLoading),
    modelDetailsError: readonly(modelDetailsError),

    // Methods
    searchStocks,
    getStockDetail,
    getFairValue,
    getModelDetails,
    clearSearch,
    clearStockDetail,
    clearFairValue,
    clearModelDetails,
  };
};
