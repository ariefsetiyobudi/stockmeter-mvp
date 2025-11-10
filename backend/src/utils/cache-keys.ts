/**
 * Cache TTL constants (in seconds)
 * Based on requirements 11.1 and 11.2
 */
export const CacheTTL = {
  /** Stock price data - 5 minutes (Requirement 11.1) */
  STOCK_PRICE: 5 * 60,
  
  /** Financial statements - 24 hours (Requirement 11.2) */
  STOCK_FINANCIALS: 24 * 60 * 60,
  
  /** Search results - 5 minutes */
  SEARCH_RESULTS: 5 * 60,
  
  /** Fair value calculations - 1 hour */
  FAIR_VALUE: 60 * 60,
  
  /** Industry peer data - 24 hours */
  INDUSTRY_PEERS: 24 * 60 * 60,
  
  /** Stock profile - 5 minutes */
  STOCK_PROFILE: 5 * 60,
  
  /** Exchange rates for currency conversion - 24 hours */
  EXCHANGE_RATES: 24 * 60 * 60,
} as const;

/**
 * Cache key generation utilities for consistent naming
 * Pattern: {namespace}:{entity}:{identifier}
 */
export const CacheKeys = {
  /**
   * Generate cache key for stock price
   * @param ticker Stock ticker symbol
   * @returns Cache key: stock:price:{ticker}
   */
  stockPrice: (ticker: string): string => {
    return `stock:price:${ticker.toUpperCase()}`;
  },

  /**
   * Generate cache key for stock financials
   * @param ticker Stock ticker symbol
   * @param period Financial period (annual or quarterly)
   * @returns Cache key: stock:financials:{ticker}:{period}
   */
  stockFinancials: (ticker: string, period: 'annual' | 'quarterly' = 'annual'): string => {
    return `stock:financials:${ticker.toUpperCase()}:${period}`;
  },

  /**
   * Generate cache key for stock profile
   * @param ticker Stock ticker symbol
   * @returns Cache key: stock:profile:{ticker}
   */
  stockProfile: (ticker: string): string => {
    return `stock:profile:${ticker.toUpperCase()}`;
  },

  /**
   * Generate cache key for search results
   * @param query Search query string
   * @returns Cache key: search:results:{query}
   */
  searchResults: (query: string): string => {
    return `search:results:${query.toLowerCase().trim()}`;
  },

  /**
   * Generate cache key for fair value calculation
   * @param ticker Stock ticker symbol
   * @returns Cache key: valuation:fairvalue:{ticker}
   */
  fairValue: (ticker: string): string => {
    return `valuation:fairvalue:${ticker.toUpperCase()}`;
  },

  /**
   * Generate cache key for DCF valuation
   * @param ticker Stock ticker symbol
   * @returns Cache key: valuation:dcf:{ticker}
   */
  dcfValuation: (ticker: string): string => {
    return `valuation:dcf:${ticker.toUpperCase()}`;
  },

  /**
   * Generate cache key for DDM valuation
   * @param ticker Stock ticker symbol
   * @returns Cache key: valuation:ddm:{ticker}
   */
  ddmValuation: (ticker: string): string => {
    return `valuation:ddm:${ticker.toUpperCase()}`;
  },

  /**
   * Generate cache key for relative valuation
   * @param ticker Stock ticker symbol
   * @returns Cache key: valuation:relative:{ticker}
   */
  relativeValuation: (ticker: string): string => {
    return `valuation:relative:${ticker.toUpperCase()}`;
  },

  /**
   * Generate cache key for Graham Number valuation
   * @param ticker Stock ticker symbol
   * @returns Cache key: valuation:graham:{ticker}
   */
  grahamValuation: (ticker: string): string => {
    return `valuation:graham:${ticker.toUpperCase()}`;
  },

  /**
   * Generate cache key for industry peers
   * @param ticker Stock ticker symbol
   * @returns Cache key: stock:peers:{ticker}
   */
  industryPeers: (ticker: string): string => {
    return `stock:peers:${ticker.toUpperCase()}`;
  },

  /**
   * Generate cache key for exchange rates
   * @param fromCurrency Source currency code
   * @param toCurrency Target currency code
   * @returns Cache key: exchange:rate:{from}:{to}
   */
  exchangeRate: (fromCurrency: string, toCurrency: string): string => {
    return `exchange:rate:${fromCurrency.toUpperCase()}:${toCurrency.toUpperCase()}`;
  },

  /**
   * Generate cache key for provider status
   * @param providerName Provider name
   * @returns Cache key: provider:status:{name}
   */
  providerStatus: (providerName: string): string => {
    return `provider:status:${providerName.toLowerCase()}`;
  },

  /**
   * Generate cache key for user watchlist
   * @param userId User ID
   * @returns Cache key: user:watchlist:{userId}
   */
  userWatchlist: (userId: string): string => {
    return `user:watchlist:${userId}`;
  },

  /**
   * Generate pattern for deleting all stock-related cache
   * @param ticker Stock ticker symbol
   * @returns Cache key pattern: stock:*:{ticker}
   */
  stockPattern: (ticker: string): string => {
    return `stock:*:${ticker.toUpperCase()}`;
  },

  /**
   * Generate pattern for deleting all valuation cache for a stock
   * @param ticker Stock ticker symbol
   * @returns Cache key pattern: valuation:*:{ticker}
   */
  valuationPattern: (ticker: string): string => {
    return `valuation:*:${ticker.toUpperCase()}`;
  },
} as const;

export default CacheKeys;
