import Redis from 'ioredis';
import { createLogger } from '../utils/logger';

const logger = createLogger('CacheService');

/**
 * CacheService provides Redis-based caching functionality
 * with connection management, error handling, and retry logic
 */
export class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;

  constructor() {
    const redisConfig = {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      password: process.env['REDIS_PASSWORD'] || undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    this.redis = new Redis(redisConfig);

    // Connection event handlers
    this.redis.on('connect', () => {
      logger.info('Redis connection established');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Parsed value or null if not found or error
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache get');
        return null;
      }

      const data = await this.redis.get(key);
      
      if (!data) {
        logger.debug(`Cache miss for key: ${key}`);
        return null;
      }

      logger.debug(`Cache hit for key: ${key}`);
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache set');
        return;
      }

      const serialized = JSON.stringify(value);

      if (ttl && ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
        logger.debug(`Cache set for key: ${key} with TTL: ${ttl}s`);
      } else {
        await this.redis.set(key, serialized);
        logger.debug(`Cache set for key: ${key} without TTL`);
      }
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache delete');
        return;
      }

      await this.redis.del(key);
      logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param pattern Key pattern (e.g., "stock:*")
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache pattern delete');
        return;
      }

      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Cache deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

/**
 * Get the singleton CacheService instance
 */
export const getCacheService = (): CacheService => {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
  }
  return cacheServiceInstance;
};

export default CacheService;
