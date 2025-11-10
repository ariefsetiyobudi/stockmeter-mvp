/**
 * Example usage of CacheService
 * This file demonstrates how to use the Redis caching service
 */

import { getCacheService } from './cache.service';
import { CacheKeys, CacheTTL } from '../utils/cache-keys';

// Example 1: Basic cache operations
async function basicCacheExample() {
  const cache = getCacheService();

  // Set a value with TTL
  await cache.set('user:123', { name: 'John Doe', email: 'john@example.com' }, 3600);

  // Get a value
  const user = await cache.get<{ name: string; email: string }>('user:123');
  console.log(user); // { name: 'John Doe', email: 'john@example.com' }

  // Delete a value
  await cache.del('user:123');
}

// Example 2: Caching stock price data
async function stockPriceCacheExample() {
  const cache = getCacheService();
  const ticker = 'AAPL';

  // Generate cache key using utility
  const cacheKey = CacheKeys.stockPrice(ticker);

  // Check cache first
  let stockPrice = await cache.get<{ price: number; timestamp: Date }>(cacheKey);

  if (!stockPrice) {
    // Cache miss - fetch from API
    console.log('Cache miss, fetching from API...');
    stockPrice = {
      price: 150.25,
      timestamp: new Date(),
    };

    // Store in cache with 5-minute TTL
    await cache.set(cacheKey, stockPrice, CacheTTL.STOCK_PRICE);
  } else {
    console.log('Cache hit!');
  }

  return stockPrice;
}

// Example 3: Caching financial statements
async function financialsCacheExample() {
  const cache = getCacheService();
  const ticker = 'AAPL';

  const cacheKey = CacheKeys.stockFinancials(ticker, 'annual');

  let financials = await cache.get(cacheKey);

  if (!financials) {
    // Fetch from provider
    financials = {
      ticker,
      period: 'annual',
      statements: [
        /* financial data */
      ],
    };

    // Cache for 24 hours
    await cache.set(cacheKey, financials, CacheTTL.STOCK_FINANCIALS);
  }

  return financials;
}

// Example 4: Invalidating cache for a stock
async function invalidateStockCache() {
  const cache = getCacheService();
  const ticker = 'AAPL';

  // Delete all stock-related cache
  await cache.delPattern(CacheKeys.stockPattern(ticker));

  // Delete all valuation cache
  await cache.delPattern(CacheKeys.valuationPattern(ticker));
}

// Example 5: Using cache in a service method
class StockService {
  private cache = getCacheService();

  async getStockPrice(ticker: string) {
    const cacheKey = CacheKeys.stockPrice(ticker);

    // Try cache first
    const cached = await this.cache.get<{ price: number; currency: string }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from provider (simulated)
    const price = {
      price: 150.25,
      currency: 'USD',
    };

    // Cache the result
    await this.cache.set(cacheKey, price, CacheTTL.STOCK_PRICE);

    return price;
  }

  async getFairValue(ticker: string) {
    const cacheKey = CacheKeys.fairValue(ticker);

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate fair value (simulated)
    const fairValue = {
      ticker,
      currentPrice: 150.25,
      dcf: { fairValue: 160.0 },
      ddm: { fairValue: 155.0 },
      valuationStatus: 'undervalued',
    };

    // Cache for 1 hour
    await this.cache.set(cacheKey, fairValue, CacheTTL.FAIR_VALUE);

    return fairValue;
  }
}

export { basicCacheExample, stockPriceCacheExample, financialsCacheExample, invalidateStockCache, StockService };
