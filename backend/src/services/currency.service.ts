import axios from 'axios';
import { CacheService } from './cache.service';
import { logger } from '../utils/logger';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export class CurrencyService {
  private cacheService: CacheService;
  private baseCurrency = 'USD';
  private cacheTTL = 86400; // 24 hours in seconds

  constructor() {
    this.cacheService = new CacheService();
  }

  /**
   * Get exchange rates from cache or API
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    const cacheKey = `exchange_rates:${this.baseCurrency}`;

    // Try to get from cache first
    const cached = await this.cacheService.get<ExchangeRates>(cacheKey);
    if (cached) {
      logger.info('Exchange rates retrieved from cache');
      return cached;
    }

    // Fetch from API
    try {
      const rates = await this.fetchExchangeRates();
      
      // Cache the result
      await this.cacheService.set(cacheKey, rates, this.cacheTTL);
      
      logger.info('Exchange rates fetched from API and cached');
      return rates;
    } catch (error) {
      logger.error('Failed to fetch exchange rates:', error);
      
      // Return fallback rates if API fails
      return this.getFallbackRates();
    }
  }

  /**
   * Fetch exchange rates from external API
   * Using exchangerate-api.com (free tier: 1,500 requests/month)
   */
  private async fetchExchangeRates(): Promise<ExchangeRates> {
    const apiKey = process.env['EXCHANGE_RATE_API_KEY'];
    
    if (!apiKey) {
      logger.warn('EXCHANGE_RATE_API_KEY not set, using fallback rates');
      return this.getFallbackRates();
    }

    try {
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${this.baseCurrency}`,
        { timeout: 5000 }
      );

      if (response.data.result === 'success') {
        return {
          base: this.baseCurrency,
          rates: response.data.conversion_rates,
          timestamp: Date.now(),
        };
      }

      throw new Error('Invalid API response');
    } catch (error) {
      logger.error('Exchange rate API error:', error);
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();

    // If base currency is USD and we're converting from USD
    if (fromCurrency === this.baseCurrency) {
      const rate = rates.rates[toCurrency];
      if (!rate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }
      return amount * rate;
    }

    // If converting to USD
    if (toCurrency === this.baseCurrency) {
      const rate = rates.rates[fromCurrency];
      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency}`);
      }
      return amount / rate;
    }

    // Converting between two non-USD currencies
    const fromRate = rates.rates[fromCurrency];
    const toRate = rates.rates[toCurrency];

    if (!fromRate || !toRate) {
      throw new Error(`Exchange rates not found for ${fromCurrency} or ${toCurrency}`);
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  /**
   * Get fallback exchange rates (approximate values)
   * Used when API is unavailable
   */
  private getFallbackRates(): ExchangeRates {
    return {
      base: this.baseCurrency,
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
  }

  /**
   * Format currency value with symbol
   */
  formatCurrency(amount: number, currency: string): string {
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

    return `${symbol}${amount.toFixed(2).toLocaleString()}`;
  }
}
