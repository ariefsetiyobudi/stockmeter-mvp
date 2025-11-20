/**
 * Currency conversion utility
 * Fetches exchange rates and converts prices based on user preference
 * Requirements: 13.3, 13.4, 13.5
 */

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

const CACHE_KEY = 'exchange_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch exchange rates from API
 * Uses exchangerate-api.com free tier (1500 requests/month)
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    // Using exchangerate-api.com free tier
    // Alternative: Use backend endpoint that caches rates
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    return {
      base: 'USD',
      rates: data.rates,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback rates if API fails
    return {
      base: 'USD',
      rates: {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        IDR: 15600,
        SGD: 1.35,
        AUD: 1.52,
        CAD: 1.36,
        CNY: 7.24,
        INR: 83.12,
      },
      timestamp: Date.now(),
    };
  }
}

/**
 * Get cached exchange rates or fetch new ones
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  // Check if we have cached rates
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    
    if (cached) {
      try {
        const rates: ExchangeRates = JSON.parse(cached);
        
        // Check if cache is still valid (within 24 hours)
        if (Date.now() - rates.timestamp < CACHE_DURATION) {
          return rates;
        }
      } catch (error) {
        console.error('Error parsing cached rates:', error);
      }
    }
  }

  // Fetch new rates
  const rates = await fetchExchangeRates();
  
  // Cache the rates
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    } catch (error) {
      console.error('Error caching rates:', error);
    }
  }

  return rates;
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates();
  
  // Convert to USD first (base currency)
  const amountInUSD = fromCurrency === 'USD' 
    ? amount 
    : amount / rates.rates[fromCurrency];
  
  // Convert from USD to target currency
  const convertedAmount = toCurrency === 'USD'
    ? amountInUSD
    : amountInUSD * rates.rates[toCurrency];

  return convertedAmount;
}

/**
 * Format currency with proper symbol and decimals
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: {
    decimals?: number;
    showSymbol?: boolean;
    showCode?: boolean;
  } = {}
): string {
  const {
    decimals = 2,
    showSymbol = true,
    showCode = false,
  } = options;

  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || '$';

  // Format number with commas
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let result = '';
  
  if (showSymbol) {
    result = `${symbol}${formattedAmount}`;
  } else {
    result = formattedAmount;
  }

  if (showCode) {
    result = `${result} ${currencyCode}`;
  }

  return result;
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || '$';
}

/**
 * Get currency name for a currency code
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || 'US Dollar';
}

/**
 * Clear cached exchange rates
 */
export function clearExchangeRatesCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}
