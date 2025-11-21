import {
  StockSearchResult,
  StockProfile,
  StockPrice,
  FinancialStatements,
  IndustryPeer,
} from '../types';
import { logger } from '../utils/logger';
import { YahooFinanceProvider } from './yahoo-finance.provider';
import { FMPProvider } from './fmp.provider';
import { AlphaVantageProvider } from './alpha-vantage.provider';
import { TwelveDataProvider } from './twelve-data.provider';

// Type alias for financial data providers
type IFinancialDataProvider = YahooFinanceProvider | FMPProvider | AlphaVantageProvider | TwelveDataProvider;

interface ProviderHealth {
  name: string;
  isHealthy: boolean;
  failureCount: number;
  lastFailure: Date | null;
  rateLimitRemaining: number | null;
  lastChecked: Date;
}

export class ProviderManager {
  private providers: Array<{ name: string; provider: IFinancialDataProvider }>;
  private healthStatus: Map<string, ProviderHealth>;
  private currentProviderIndex: number = 0;
  private maxFailuresBeforeSwitch: number = 3;

  constructor() {
    // Initialize providers in priority order
    // FMP first (stable API working), then Twelve Data, Yahoo Finance, Alpha Vantage last (rate limited)
    this.providers = [
      { name: 'Financial Modeling Prep', provider: new FMPProvider() },
      { name: 'Twelve Data', provider: new TwelveDataProvider() },
      { name: 'Yahoo Finance', provider: new YahooFinanceProvider() },
      { name: 'Alpha Vantage', provider: new AlphaVantageProvider() },
    ];

    // Initialize health status for each provider
    this.healthStatus = new Map();
    this.providers.forEach(({ name }) => {
      this.healthStatus.set(name, {
        name,
        isHealthy: true,
        failureCount: 0,
        lastFailure: null,
        rateLimitRemaining: null,
        lastChecked: new Date(),
      });
    });

    logger.info(`ProviderManager initialized with providers: ${this.providers.map(p => p.name).join(', ')}`);
    logger.info(`Primary provider: ${this.providers[0].name}`);
  }

  /**
   * Execute an operation with automatic failover to backup providers
   */
  async executeWithFailover<T>(
    operation: (provider: IFinancialDataProvider) => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    const errors: Array<{ provider: string; error: Error }> = [];
    
    // Try each provider in sequence
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentProviderIndex + i) % this.providers.length;
      const { name, provider } = this.providers[providerIndex];
      const health = this.healthStatus.get(name)!;

      // Skip unhealthy providers unless all are unhealthy
      if (!health.isHealthy && i < this.providers.length - 1) {
        logger.warn(`Skipping unhealthy provider: ${name}`);
        continue;
      }

      try {
        logger.info(`Executing ${operationName} with provider: ${name}`);
        
        const result = await operation(provider);
        
        // Operation succeeded - update health status
        this.recordSuccess(name);
        
        // Update current provider index if we switched
        if (providerIndex !== this.currentProviderIndex) {
          logger.info(`Switched primary provider from ${this.providers[this.currentProviderIndex].name} to ${name}`);
          this.currentProviderIndex = providerIndex;
        }
        
        return result;
      } catch (error: any) {
        logger.error(`Provider ${name} failed for ${operationName}:`, error.message);
        
        // Record failure
        this.recordFailure(name, error);
        errors.push({ provider: name, error });
        
        // Check if we should switch providers
        if (health.failureCount >= this.maxFailuresBeforeSwitch) {
          logger.warn(`Provider ${name} exceeded failure threshold, marking as unhealthy`);
          health.isHealthy = false;
        }
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    logger.error(`All providers failed for ${operationName}`);
    const errorMessages = errors.map(e => `${e.provider}: ${e.error.message}`).join('; ');
    throw new Error(`All financial data providers failed. Errors: ${errorMessages}`);
  }

  /**
   * Search for stocks across providers with failover
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    return this.executeWithFailover(
      (provider) => provider.searchStocks(query),
      `searchStocks(${query})`
    );
  }

  /**
   * Get stock profile with failover
   */
  async getStockProfile(ticker: string): Promise<StockProfile> {
    return this.executeWithFailover(
      (provider) => provider.getStockProfile(ticker),
      `getStockProfile(${ticker})`
    );
  }

  /**
   * Get stock price with failover
   */
  async getStockPrice(ticker: string): Promise<StockPrice> {
    return this.executeWithFailover(
      (provider) => provider.getStockPrice(ticker),
      `getStockPrice(${ticker})`
    );
  }

  /**
   * Get financial statements with failover
   */
  async getFinancials(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatements> {
    return this.executeWithFailover(
      (provider) => provider.getFinancials(ticker, period),
      `getFinancials(${ticker}, ${period})`
    );
  }

  /**
   * Get industry peers with failover
   */
  async getIndustryPeers(ticker: string): Promise<IndustryPeer[]> {
    return this.executeWithFailover(
      (provider) => provider.getIndustryPeers(ticker),
      `getIndustryPeers(${ticker})`
    );
  }

  /**
   * Record a successful operation for a provider
   */
  private recordSuccess(providerName: string): void {
    const health = this.healthStatus.get(providerName);
    if (health) {
      health.failureCount = 0;
      health.isHealthy = true;
      health.lastChecked = new Date();
      
      logger.debug(`Provider ${providerName} health: OK`);
    }
  }

  /**
   * Record a failed operation for a provider
   */
  private recordFailure(providerName: string, error: Error): void {
    const health = this.healthStatus.get(providerName);
    if (health) {
      health.failureCount++;
      health.lastFailure = new Date();
      health.lastChecked = new Date();
      
      // Check for rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        health.rateLimitRemaining = 0;
        logger.warn(`Provider ${providerName} hit rate limit`);
      }
      
      logger.debug(`Provider ${providerName} failure count: ${health.failureCount}`);
    }
  }

  /**
   * Get health status of all providers
   */
  getHealthStatus(): ProviderHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get current active provider
   */
  getCurrentProvider(): string {
    return this.providers[this.currentProviderIndex].name;
  }

  /**
   * Manually set a provider as healthy (for recovery)
   */
  markProviderHealthy(providerName: string): void {
    const health = this.healthStatus.get(providerName);
    if (health) {
      health.isHealthy = true;
      health.failureCount = 0;
      health.lastChecked = new Date();
      logger.info(`Provider ${providerName} manually marked as healthy`);
    }
  }

  /**
   * Reset all provider health statuses
   */
  resetAllProviders(): void {
    this.healthStatus.forEach((health) => {
      health.isHealthy = true;
      health.failureCount = 0;
      health.lastFailure = null;
      health.lastChecked = new Date();
    });
    logger.info('All provider health statuses reset');
  }

  /**
   * Update rate limit information for a provider
   */
  updateRateLimit(providerName: string, remaining: number): void {
    const health = this.healthStatus.get(providerName);
    if (health) {
      health.rateLimitRemaining = remaining;
      
      // Warn if approaching rate limit
      if (remaining < 100) {
        logger.warn(`Provider ${providerName} rate limit low: ${remaining} remaining`);
      }
      
      // Mark as unhealthy if rate limit reached 90%
      if (remaining < 50) {
        logger.warn(`Provider ${providerName} approaching rate limit threshold`);
      }
    }
  }
}
