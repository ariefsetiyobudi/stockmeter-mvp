import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ProviderManager } from '../adapters/provider-manager';
import { getCacheService } from '../services/cache.service';
import CacheKeys from '../utils/cache-keys';
import { requireAuth, requirePro } from '../middleware/auth.middleware';
import ValuationService from '../services/valuation.service';
import { StockSearchResult, StockProfile, StockPrice } from '../types';

// Initialize services
const providerManager = new ProviderManager();
const cacheService = getCacheService();
const valuationService = new ValuationService(providerManager);

const router = Router();

// Validation schemas
const searchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
});

/**
 * GET /api/stocks/search
 * Search for stocks by ticker or company name
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();

    // Validate query parameter
    const { q: query } = searchQuerySchema.parse(req.query);

    // Check cache first (5 min TTL)
    const cacheKey = CacheKeys.searchResults(query);
    const cachedResults = await cacheService.get(cacheKey);

    if (cachedResults) {
      const responseTime = Date.now() - startTime;
      res.status(200).json(cachedResults); // Return array directly
      return;
    }

    // Search via provider manager with failover
    const results = await providerManager.executeWithFailover(
      (provider) => provider.searchStocks(query)
    ) as StockSearchResult[];

    // Limit to 20 results
    const limitedResults = results.slice(0, 20);

    // Cache results for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, limitedResults, 300);

    const responseTime = Date.now() - startTime;

    res.status(200).json(limitedResults); // Return array directly
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search query',
          details: error.errors,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search stocks',
        details: { originalError: error.message },
      },
    });
  }
});

/**
 * GET /api/stocks/:ticker
 * Get stock profile and current price
 */
router.get('/:ticker', async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Check cache first (5 min TTL)
    const cacheKey = CacheKeys.stockProfile(upperTicker);
    const cachedProfile = await cacheService.get(cacheKey);

    if (cachedProfile) {
      res.status(200).json(cachedProfile); // Return data directly
      return;
    }

    // Fetch profile and price via provider manager
    const [profile, price] = await Promise.all([
      providerManager.executeWithFailover((provider) =>
        provider.getStockProfile(upperTicker)
      ),
      providerManager.executeWithFailover((provider) =>
        provider.getStockPrice(upperTicker)
      ),
    ]);

    const typedProfile = profile as StockProfile;
    const typedPrice = price as StockPrice;

    const result = {
      ...typedProfile,
      currentPrice: typedPrice.price,
      currency: typedPrice.currency,
      priceTimestamp: typedPrice.timestamp,
    };

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, result, 300);

    res.status(200).json(result); // Return data directly
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to retrieve stock profile',
        details: { originalError: error.message },
      },
    });
  }
});

/**
 * GET /api/stocks/:ticker/financials
 * Get financial statements for a stock
 */
router.get('/:ticker/financials', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticker } = req.params;
    const { period = 'annual' } = req.query;

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

    if (period !== 'annual' && period !== 'quarterly') {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Period must be either "annual" or "quarterly"',
          details: {},
        },
      });
      return;
    }

    const upperTicker = ticker.toUpperCase();

    // Check cache first (24 hours TTL)
    const cacheKey = CacheKeys.stockFinancials(upperTicker, period as 'annual' | 'quarterly');
    const cachedFinancials = await cacheService.get(cacheKey);

    if (cachedFinancials) {
      res.status(200).json(cachedFinancials); // Return data directly
      return;
    }

    // Fetch financials via provider manager
    const financials = await providerManager.executeWithFailover((provider) =>
      provider.getFinancials(upperTicker, period as 'annual' | 'quarterly')
    );

    // Cache for 24 hours (86400 seconds)
    await cacheService.set(cacheKey, financials, 86400);

    res.status(200).json(financials); // Return data directly
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'FINANCIALS_ERROR',
        message: 'Failed to retrieve financial statements',
        details: { originalError: error.message },
      },
    });
  }
});

/**
 * GET /api/stocks/:ticker/fairvalue
 * Calculate fair value using all valuation models
 */
router.get('/:ticker/fairvalue', async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Check cache first (1 hour TTL)
    const cacheKey = CacheKeys.fairValue(upperTicker);
    const cachedFairValue = await cacheService.get(cacheKey);

    if (cachedFairValue) {
      res.status(200).json(cachedFairValue); // Return data directly
      return;
    }

    // Calculate fair value using all models
    const fairValueResult = await valuationService.calculateAllModels(upperTicker);

    // Determine color coding based on valuation status
    const colorCoding = {
      undervalued: 'soft-green',
      fairly_priced: 'white',
      overvalued: 'soft-red',
    };

    const result = {
      ...fairValueResult,
      colorCode: colorCoding[fairValueResult.valuationStatus],
    };

    // Cache for 1 hour (3600 seconds)
    await cacheService.set(cacheKey, result, 3600);

    res.status(200).json(result); // Return data directly
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'FAIR_VALUE_ERROR',
        message: 'Failed to calculate fair value',
        details: { originalError: error.message },
      },
    });
  }
});

/**
 * POST /api/stocks/compare
 * Batch comparison of multiple stocks (Pro only)
 * Free users are redirected to single stock view
 */
router.post('/compare', requireAuth, async (req: Request, res: Response): Promise<void> => {
  // Check subscription status for free tier limitation
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

  // Free tier users get upgrade prompt
  if (req.user.subscriptionStatus !== 'pro') {
    res.status(403).json({
      error: {
        code: 'PRO_SUBSCRIPTION_REQUIRED',
        message: 'Batch comparison requires a Pro subscription. Free users can view one stock at a time.',
        details: {
          currentStatus: req.user.subscriptionStatus,
          upgradeUrl: '/pricing',
          feature: 'batch_comparison',
          limitation: 'Free users can only view single stock analysis. Upgrade to Pro to compare up to 50 stocks simultaneously.',
        },
      },
    });
    return;
  }

  // Check if subscription is expired
  if (req.user.subscriptionExpiry && req.user.subscriptionExpiry < new Date()) {
    res.status(403).json({
      error: {
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your Pro subscription has expired. Please renew to access batch comparison.',
        details: {
          expiryDate: req.user.subscriptionExpiry,
          renewUrl: '/pricing',
        },
      },
    });
    return;
  }

  // Pro user - proceed with batch comparison
  try {
    const startTime = Date.now();

    // Validate request body
    const compareSchema = z.object({
      tickers: z.array(z.string().min(1)).min(1).max(50, 'Maximum 50 stocks allowed for comparison'),
    });

    const { tickers } = compareSchema.parse(req.body);

    // Normalize tickers to uppercase
    const normalizedTickers = tickers.map(t => t.toUpperCase());

    // Remove duplicates
    const uniqueTickers = [...new Set(normalizedTickers)];

    if (uniqueTickers.length > 50) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Maximum 50 stocks allowed for comparison',
          details: { count: uniqueTickers.length },
        },
      });
      return;
    }

    // Calculate fair values for all tickers in parallel
    const comparisonPromises = uniqueTickers.map(async (ticker) => {
      try {
        // Check cache first
        const cacheKey = CacheKeys.fairValue(ticker);
        const cachedResult = await cacheService.get(cacheKey);

        if (cachedResult) {
          return {
            ticker,
            success: true,
            data: cachedResult,
          };
        }

        // Calculate fair value
        const fairValueResult = await valuationService.calculateAllModels(ticker);

        return {
          ticker,
          success: true,
          data: fairValueResult,
        };
      } catch (error: any) {
        // Return error for this ticker but don't fail entire request
        return {
          ticker,
          success: false,
          error: error.message || 'Failed to calculate fair value',
        };
      }
    });

    // Wait for all calculations to complete (with 10 second timeout)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Calculation timeout')), 10000);
    });

    let results;
    try {
      results = await Promise.race([
        Promise.all(comparisonPromises),
        timeoutPromise,
      ]) as Array<{
        ticker: string;
        success: boolean;
        data?: any;
        error?: string;
      }>;
    } catch (error) {
      res.status(504).json({
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Comparison calculation exceeded 10 second limit',
          details: {},
        },
      });
      return;
    }

    // Separate successful and failed results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Format comparison table data
    const comparisonData = successful.map(result => {
      const data = result.data;
      
      // Extract fair values from different models
      const fairValues = {
        dcf: data.dcf?.fairValue || null,
        ddm: data.ddm?.fairValue || null,
        peRatio: data.relativeValue?.peRatioFairValue || null,
        pbRatio: data.relativeValue?.pbRatioFairValue || null,
        psRatio: data.relativeValue?.psRatioFairValue || null,
        graham: data.graham?.fairValue || null,
      };

      // Calculate average fair value
      const validFairValues = Object.values(fairValues).filter(v => v !== null) as number[];
      const avgFairValue = validFairValues.length > 0
        ? validFairValues.reduce((sum, v) => sum + v, 0) / validFairValues.length
        : null;

      const colorCoding: Record<string, string> = {
        undervalued: 'soft-green',
        fairly_priced: 'white',
        overvalued: 'soft-red',
      };

      return {
        ticker: data.ticker,
        currentPrice: data.currentPrice,
        fairValues,
        avgFairValue,
        valuationStatus: data.valuationStatus,
        colorCode: colorCoding[data.valuationStatus] || 'white',
        calculatedAt: data.calculatedAt,
      };
    });

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      message: 'Batch comparison completed successfully',
      comparisons: successful.map(r => r.data), // Frontend expects 'comparisons' array
      summary: {
        total: uniqueTickers.length,
        successful: successful.length,
        failed: failed.length,
        failedTickers: failed.map(f => ({ ticker: f.ticker, error: f.error })),
      },
      responseTime: `${responseTime}ms`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'COMPARISON_ERROR',
        message: 'Failed to perform batch comparison',
        details: { originalError: error.message },
      },
    });
  }
});

/**
 * GET /api/stocks/:ticker/modeldetails
 * Get detailed calculation steps and assumptions (Pro only)
 */
router.get('/:ticker/modeldetails', requireAuth, requirePro, async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Check cache first (1 hour TTL)
    const cacheKey = CacheKeys.fairValue(upperTicker); // Use same cache key as fair value
    const cachedDetails = await cacheService.get(cacheKey);

    if (cachedDetails) {
      res.status(200).json(cachedDetails); // Return data directly
      return;
    }

    // Calculate fair value with all models to get detailed breakdown
    const fairValueResult = await valuationService.calculateAllModels(upperTicker);

    // Prepare detailed response with all calculation steps
    const detailedResult = {
      ticker: fairValueResult.ticker,
      currentPrice: fairValueResult.currentPrice,
      calculatedAt: fairValueResult.calculatedAt,
      
      dcf: fairValueResult.dcf ? {
        fairValue: fairValueResult.dcf.fairValue,
        assumptions: fairValueResult.dcf.assumptions,
        projectedCashFlows: fairValueResult.dcf.projectedCashFlows,
        calculationSteps: {
          description: 'Discounted Cash Flow (DCF) Model',
          methodology: 'Projects future free cash flows and discounts them to present value',
          steps: [
            'Calculate historical revenue CAGR from 5-year data',
            'Calculate historical FCF margin average',
            'Project 10-year revenue using growth rate',
            'Project FCF using revenue × FCF margin',
            'Determine WACC based on sector and risk profile',
            'Calculate terminal value using perpetual growth rate',
            'Discount all cash flows to present value',
            'Divide by shares outstanding for per-share value',
          ],
        },
      } : null,
      
      ddm: fairValueResult.ddm ? {
        fairValue: fairValueResult.ddm.fairValue,
        applicable: fairValueResult.ddm.applicable,
        assumptions: fairValueResult.ddm.assumptions,
        calculationSteps: {
          description: 'Dividend Discount Model (DDM)',
          methodology: 'Values stock based on present value of future dividend payments',
          steps: fairValueResult.ddm.applicable
            ? [
                'Check if stock pays dividends (last 3 years)',
                'Calculate dividend CAGR from historical data',
                'Apply Gordon Growth Model: D1 / (r - g)',
                'Use required return between 8-12%',
              ]
            : ['Stock does not pay dividends - DDM not applicable'],
        },
      } : null,
      
      relativeValue: fairValueResult.relativeValue ? {
        fairValues: {
          peRatio: fairValueResult.relativeValue.peRatioFairValue,
          pbRatio: fairValueResult.relativeValue.pbRatioFairValue,
          psRatio: fairValueResult.relativeValue.psRatioFairValue,
        },
        companyMetrics: fairValueResult.relativeValue.companyMetrics,
        industryMedians: fairValueResult.relativeValue.industryMedians,
        calculationSteps: {
          description: 'Relative Valuation (P/E, P/B, P/S Ratios)',
          methodology: 'Compares company valuation multiples to industry peers',
          steps: [
            'Fetch industry peer data (minimum 10 companies)',
            'Calculate median P/E, P/B, P/S ratios',
            'Apply industry medians to company metrics',
            'Fair Value = Company Metric × Industry Median',
          ],
        },
      } : null,
      
      graham: fairValueResult.graham ? {
        fairValue: fairValueResult.graham.fairValue,
        applicable: fairValueResult.graham.applicable,
        assumptions: fairValueResult.graham.assumptions,
        calculationSteps: {
          description: 'Graham Number',
          methodology: 'Conservative value metric based on earnings and book value',
          steps: fairValueResult.graham.applicable
            ? [
                'Extract EPS and book value per share from financials',
                'Apply Graham formula: √(22.5 × EPS × BVPS)',
                'Return fair value estimate',
              ]
            : ['EPS or book value is negative - Graham Number not applicable'],
        },
      } : null,
      
      valuationStatus: fairValueResult.valuationStatus,
    };

    // Cache for 1 hour (3600 seconds)
    await cacheService.set(cacheKey, detailedResult, 3600);

    res.status(200).json(detailedResult); // Return data directly
  } catch (error: any) {
    res.status(500).json({
      error: {
        code: 'MODEL_DETAILS_ERROR',
        message: 'Failed to retrieve model details',
        details: { originalError: error.message },
      },
    });
  }
});

export default router;
