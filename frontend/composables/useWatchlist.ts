import { useWatchlistStore } from '~/stores/watchlist';
import type { WatchlistStock } from '~/stores/watchlist';
import type { FairValueResult } from '~/types';

interface WatchlistItem {
  ticker: string;
  createdAt: string;
}

interface WatchlistResponse {
  watchlist: WatchlistItem[];
}

export const useWatchlist = () => {
  const watchlistStore = useWatchlistStore();
  const authStore = useAuthStore();
  const { isPro, isFree } = useAuth();
  const config = useRuntimeConfig();

  // Constants
  const FREE_TIER_LIMIT = 5;
  const PRO_TIER_LIMIT = Infinity;

  // Computed
  const watchlistLimit = computed(() => {
    return isPro.value ? PRO_TIER_LIMIT : FREE_TIER_LIMIT;
  });

  const isAtLimit = computed(() => {
    return watchlistStore.stockCount >= watchlistLimit.value;
  });

  const remainingSlots = computed(() => {
    if (isPro.value) return Infinity;
    return Math.max(0, FREE_TIER_LIMIT - watchlistStore.stockCount);
  });

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    if (authStore.accessToken) {
      headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return headers;
  };

  // Load watchlist from API
  const loadWatchlist = async (): Promise<void> => {
    watchlistStore.setLoading(true);
    watchlistStore.setError(null);

    try {
      // Fetch watchlist tickers
      const response = await $fetch<WatchlistResponse>('/api/user/watchlist', {
        baseURL: config.public.apiBaseUrl,
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.watchlist || response.watchlist.length === 0) {
        watchlistStore.setStocks([]);
        return;
      }

      // Fetch fair values for all watchlist stocks
      const enrichedStocks: WatchlistStock[] = [];

      // Fetch data for each stock (could be optimized with batch endpoint)
      for (const item of response.watchlist) {
        try {
          // Fetch fair value for the stock
          const fairValue = await $fetch<FairValueResult>(
            `/api/stocks/${item.ticker}/fairvalue`,
            {
              baseURL: config.public.apiBaseUrl,
              method: 'GET',
              headers: getAuthHeaders(),
            }
          );

          enrichedStocks.push({
            ticker: item.ticker,
            name: item.ticker, // Using ticker as name fallback
            price: fairValue.currentPrice,
            valuationStatus: fairValue.valuationStatus,
            addedAt: new Date(item.createdAt),
          });
        } catch (error) {
          console.error(`Failed to fetch data for ${item.ticker}:`, error);
          // Add stock with minimal data if fetch fails
          enrichedStocks.push({
            ticker: item.ticker,
            name: item.ticker,
            price: 0,
            valuationStatus: 'fairly_priced',
            addedAt: new Date(item.createdAt),
          });
        }
      }

      watchlistStore.setStocks(enrichedStocks);
    } catch (error: any) {
      console.error('Load watchlist error:', error);
      watchlistStore.setError(
        error.data?.error?.message || 'Failed to load watchlist'
      );
      watchlistStore.setStocks([]);
    } finally {
      watchlistStore.setLoading(false);
    }
  };

  // Add stock to watchlist
  const addToWatchlist = async (ticker: string): Promise<boolean> => {
    // Check if already in watchlist
    if (watchlistStore.hasTicker(ticker)) {
      watchlistStore.setError('Stock is already in your watchlist');
      return false;
    }

    // Check tier limitations
    if (isFree.value && watchlistStore.stockCount >= FREE_TIER_LIMIT) {
      watchlistStore.setError(
        `Free users can only add ${FREE_TIER_LIMIT} stocks to watchlist. Upgrade to Pro for unlimited watchlist.`
      );
      return false;
    }

    if (isPro.value && watchlistStore.stockCount >= 1000) {
      // Reasonable upper limit even for Pro
      watchlistStore.setError('Maximum watchlist size reached');
      return false;
    }

    watchlistStore.setLoading(true);
    watchlistStore.setError(null);

    try {
      // Add to backend
      await $fetch('/api/user/watchlist', {
        baseURL: config.public.apiBaseUrl,
        method: 'POST',
        headers: getAuthHeaders(),
        body: { ticker },
      });

      // Fetch fair value for the new stock
      const fairValue = await $fetch<FairValueResult>(
        `/api/stocks/${ticker}/fairvalue`,
        {
          baseURL: config.public.apiBaseUrl,
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      // Add to local state
      watchlistStore.addStock({
        ticker,
        name: ticker,
        price: fairValue.currentPrice,
        valuationStatus: fairValue.valuationStatus,
        addedAt: new Date(),
      });

      return true;
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      watchlistStore.setError(
        error.data?.error?.message || 'Failed to add stock to watchlist'
      );
      return false;
    } finally {
      watchlistStore.setLoading(false);
    }
  };

  // Remove stock from watchlist
  const removeFromWatchlist = async (ticker: string): Promise<boolean> => {
    watchlistStore.setLoading(true);
    watchlistStore.setError(null);

    try {
      // Remove from backend
      await $fetch(`/api/user/watchlist/${ticker}`, {
        baseURL: config.public.apiBaseUrl,
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      // Remove from local state
      watchlistStore.removeStock(ticker);

      return true;
    } catch (error: any) {
      console.error('Remove from watchlist error:', error);
      watchlistStore.setError(
        error.data?.error?.message || 'Failed to remove stock from watchlist'
      );
      return false;
    } finally {
      watchlistStore.setLoading(false);
    }
  };

  // Refresh watchlist data (re-fetch prices and valuations)
  const refreshWatchlist = async (): Promise<void> => {
    await loadWatchlist();
  };

  // Clear error
  const clearError = () => {
    watchlistStore.setError(null);
  };

  return {
    // State
    stocks: computed(() => watchlistStore.stocks),
    stockCount: computed(() => watchlistStore.stockCount),
    isLoading: computed(() => watchlistStore.isLoading),
    error: computed(() => watchlistStore.error),

    // Tier limitations
    watchlistLimit: readonly(watchlistLimit),
    isAtLimit: readonly(isAtLimit),
    remainingSlots: readonly(remainingSlots),

    // Methods
    loadWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    refreshWatchlist,
    clearError,

    // Helpers
    hasTicker: (ticker: string) => watchlistStore.hasTicker(ticker),
    getByTicker: (ticker: string) => watchlistStore.getByTicker(ticker),
  };
};
