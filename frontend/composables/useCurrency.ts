import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

const exchangeRates = ref<ExchangeRates | null>(null);
const isLoadingRates = ref(false);
const lastFetchTime = ref<number>(0);
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useCurrency = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  // Get user's preferred currency
  const userCurrency = computed(() => {
    return authStore.user?.currencyPreference || 'USD';
  });

  /**
   * Fetch exchange rates from API
   */
  const fetchExchangeRates = async (force = false): Promise<ExchangeRates> => {
    const now = Date.now();
    
    // Return cached rates if still valid and not forcing refresh
    if (!force && exchangeRates.value && (now - lastFetchTime.value) < CACHE_DURATION) {
      return exchangeRates.value;
    }

    isLoadingRates.value = true;

    try {
      const response = await $fetch<{ data: ExchangeRates }>('/api/currency/rates', {
        baseURL: config.public.apiBaseUrl,
      });

      exchangeRates.value = response.data;
      lastFetchTime.value = now;
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      
      // Return fallback rates if fetch fails
      if (!exchangeRates.value) {
        exchangeRates.value = getFallbackRates();
      }
      
      return exchangeRates.value;
    } finally {
      isLoadingRates.value = false;
    }
  };

  /**
   * Convert amount from one currency to another
   */
  const convertCurrency = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Ensure we have exchange rates
    const rates = await fetchExchangeRates();

    // If base currency is USD and we're converting from USD
    if (fromCurrency === rates.base) {
      const rate = rates.rates[toCurrency];
      if (!rate) {
        console.warn(`Exchange rate not found for ${toCurrency}, returning original amount`);
        return amount;
      }
      return amount * rate;
    }

    // If converting to USD
    if (toCurrency === rates.base) {
      const rate = rates.rates[fromCurrency];
      if (!rate) {
        console.warn(`Exchange rate not found for ${fromCurrency}, returning original amount`);
        return amount;
      }
      return amount / rate;
    }

    // Converting between two non-USD currencies
    const fromRate = rates.rates[fromCurrency];
    const toRate = rates.rates[toCurrency];

    if (!fromRate || !toRate) {
      console.warn(`Exchange rates not found for ${fromCurrency} or ${toCurrency}, returning original amount`);
      return amount;
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  };

  /**
   * Convert amount to user's preferred currency
   */
  const convertToUserCurrency = async (amount: number, fromCurrency: string = 'USD'): Promise<number> => {
    return convertCurrency(amount, fromCurrency, userCurrency.value);
  };

  /**
   * Format currency value with symbol
   */
  const formatCurrency = (amount: number, currency: string = userCurrency.value): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      IDR: 'Rp',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      AUD: 'A$',
      CAD: 'C$',
      SGD: 'S$',
      MYR: 'RM',
      THB: '฿',
      PHP: '₱',
      VND: '₫',
    };

    const symbol = symbols[currency] || currency;
    
    // Format based on currency
    if (currency === 'IDR' || currency === 'VND' || currency === 'JPY') {
      // No decimal places for these currencies
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }

    return `${symbol}${amount.toFixed(2)}`;
  };

  /**
   * Format and convert price to user's preferred currency
   */
  const formatPrice = async (amount: number, fromCurrency: string = 'USD'): Promise<string> => {
    const converted = await convertToUserCurrency(amount, fromCurrency);
    return formatCurrency(converted, userCurrency.value);
  };

  /**
   * Get fallback exchange rates
   */
  const getFallbackRates = (): ExchangeRates => {
    return {
      base: 'USD',
      rates: {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        IDR: 15750.0,
        JPY: 149.5,
        CNY: 7.24,
        INR: 83.12,
        AUD: 1.53,
        CAD: 1.36,
        SGD: 1.34,
        MYR: 4.72,
        THB: 35.8,
        PHP: 56.5,
        VND: 24500.0,
      },
      timestamp: Date.now(),
    };
  };

  return {
    exchangeRates: computed(() => exchangeRates.value),
    isLoadingRates: computed(() => isLoadingRates.value),
    userCurrency,
    fetchExchangeRates,
    convertCurrency,
    convertToUserCurrency,
    formatCurrency,
    formatPrice,
  };
};
