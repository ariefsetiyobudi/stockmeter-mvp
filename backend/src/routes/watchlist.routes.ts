import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.middleware';
import { ProviderManager } from '../adapters/provider-manager';
import ValuationService from '../services/valuation.service';
import { getCacheService } from '../services/cache.service';
import CacheKeys from '../utils/cache-keys';
import { FairValueResult, StockPrice } from '../types';

const router = Router();
const prisma = new PrismaClient();
const providerManager = new ProviderManager();
const valuationService = new ValuationService(providerManager);
const cacheService = getCacheService();

// Validation schemas
const addWatchlistSchema = z.object({
  ticker: z.string().min(1, 'Ticker symbol is required').max(10, 'Ticker symbol too long'),
});

/**
 * GET /api/user/watchlist
 * Fetch user's watchlist with enriched data
 */
router.get('/watchlist', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: {},
        },
      });
      return;
    }

    // Fetch user's watchlist from database
    const watchlistItems = await prisma.watchlist.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // If watchlist is empty, return empty array
    if (watchlistItems.length === 0) {
      res.status(200).json({
        message: 'Watchlist retrieved successfully',
        data: {
          watchlist: [],
          count: 0,
          limit: req.user.subscriptionStatus === 'pro' ? null : 5,
        },
      });
      return;
    }

    // Enrich watchlist data with current prices and valuation status
    const enrichedWatchlist = await Promise.all(
      watchlistItems.map(async (item) => {
        try {
          // Fetch current price
          const pricePromise = providerManager.executeWithFailover((provider) =>
            provider.getStockPrice(item.ticker)
          );

          // Fetch fair value (check cache first)
          const cacheKey = CacheKeys.fairValue(item.ticker);
          let fairValueResult = await cacheService.get<FairValueResult>(cacheKey);

          if (!fairValueResult) {
            // Calculate fair value if not cached
            fairValueResult = await valuationService.calculateAllModels(item.ticker);
            await cacheService.set(cacheKey, fairValueResult, 3600); // Cache for 1 hour
          }

          const price = await pricePromise;
          const typedPrice = price as StockPrice;

          // Calculate average fair value from all models
          const fairValues = [
            fairValueResult.dcf?.fairValue,
            fairValueResult.ddm?.fairValue,
            fairValueResult.relativeValue?.peRatioFairValue,
            fairValueResult.relativeValue?.pbRatioFairValue,
            fairValueResult.relativeValue?.psRatioFairValue,
            fairValueResult.graham?.fairValue,
          ].filter((v) => v !== null && v !== undefined) as number[];

          const avgFairValue = fairValues.length > 0
            ? fairValues.reduce((sum, v) => sum + v, 0) / fairValues.length
            : null;

          return {
            ticker: item.ticker,
            addedAt: item.createdAt,
            currentPrice: typedPrice.price,
            currency: typedPrice.currency,
            avgFairValue,
            valuationStatus: fairValueResult.valuationStatus,
            priceTimestamp: typedPrice.timestamp,
          };
        } catch (error: any) {
          // If enrichment fails for a stock, return basic info
          return {
            ticker: item.ticker,
            addedAt: item.createdAt,
            currentPrice: null,
            currency: null,
            avgFairValue: null,
            valuationStatus: null,
            error: 'Failed to fetch current data',
          };
        }
      })
    );

    res.status(200).json({
      message: 'Watchlist retrieved successfully',
      data: {
        watchlist: enrichedWatchlist,
        count: watchlistItems.length,
        limit: req.user.subscriptionStatus === 'pro' ? null : 5,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'WATCHLIST_ERROR',
        message: 'Failed to retrieve watchlist',
        details: { originalError: error.message },
      },
    });
  }
});

/**
 * POST /api/user/watchlist
 * Add stock to user's watchlist
 */
router.post('/watchlist', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: {},
        },
      });
      return;
    }

    // Validate request body
    const validatedData = addWatchlistSchema.parse(req.body);
    const ticker = validatedData.ticker.toUpperCase();

    // Check current watchlist count
    const currentCount = await prisma.watchlist.count({
      where: { userId: req.user.id },
    });

    // Check tier limitations
    if (req.user.subscriptionStatus !== 'pro' && currentCount >= 5) {
      res.status(403).json({
        error: {
          code: 'WATCHLIST_LIMIT_REACHED',
          message: 'Free users can only add up to 5 stocks to their watchlist. Upgrade to Pro for unlimited watchlist.',
          details: {
            currentCount,
            limit: 5,
            upgradeUrl: '/pricing',
          },
        },
      });
      return;
    }

    // Check if stock already exists in watchlist
    const existingItem = await prisma.watchlist.findUnique({
      where: {
        userId_ticker: {
          userId: req.user.id,
          ticker,
        },
      },
    });

    if (existingItem) {
      res.status(409).json({
        error: {
          code: 'ALREADY_IN_WATCHLIST',
          message: 'This stock is already in your watchlist',
          details: { ticker },
        },
      });
      return;
    }

    // Verify that the ticker exists by fetching stock profile
    try {
      await providerManager.executeWithFailover((provider) =>
        provider.getStockProfile(ticker)
      );
    } catch (error) {
      res.status(404).json({
        error: {
          code: 'STOCK_NOT_FOUND',
          message: 'Stock ticker not found',
          details: { ticker },
        },
      });
      return;
    }

    // Add to watchlist
    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: req.user.id,
        ticker,
      },
    });

    res.status(201).json({
      message: 'Stock added to watchlist successfully',
      data: {
        id: watchlistItem.id,
        ticker: watchlistItem.ticker,
        addedAt: watchlistItem.createdAt,
        currentCount: currentCount + 1,
        limit: req.user.subscriptionStatus === 'pro' ? null : 5,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'WATCHLIST_ERROR',
        message: 'Failed to add stock to watchlist',
        details: { originalError: error.message },
      },
    });
  }
});

/**
 * DELETE /api/user/watchlist/:ticker
 * Remove stock from user's watchlist
 */
router.delete('/watchlist/:ticker', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: {},
        },
      });
      return;
    }

    const { ticker } = req.params;

    if (!ticker || ticker.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ticker symbol is required',
          details: {},
        },
      });
      return;
    }

    const upperTicker = ticker.toUpperCase();

    // Check if item exists
    const existingItem = await prisma.watchlist.findUnique({
      where: {
        userId_ticker: {
          userId: req.user.id,
          ticker: upperTicker,
        },
      },
    });

    if (!existingItem) {
      res.status(404).json({
        error: {
          code: 'NOT_IN_WATCHLIST',
          message: 'This stock is not in your watchlist',
          details: { ticker: upperTicker },
        },
      });
      return;
    }

    // Delete from watchlist
    await prisma.watchlist.delete({
      where: {
        userId_ticker: {
          userId: req.user.id,
          ticker: upperTicker,
        },
      },
    });

    res.status(200).json({
      message: 'Stock removed from watchlist successfully',
      data: {
        ticker: upperTicker,
        removedAt: new Date(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'WATCHLIST_ERROR',
        message: 'Failed to remove stock from watchlist',
        details: { originalError: error.message },
      },
    });
  }
});

export default router;
