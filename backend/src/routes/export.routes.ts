import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requirePro } from '../middleware/auth.middleware';
import ExportService from '../services/export.service';
import ValuationService from '../services/valuation.service';
import { ProviderManager } from '../adapters/provider-manager';
import { getCacheService } from '../services/cache.service';
import CacheKeys from '../utils/cache-keys';
import { createLogger } from '../utils/logger';

const logger = createLogger('ExportRoutes');

// Initialize services
const providerManager = new ProviderManager();
const valuationService = new ValuationService(providerManager);
const exportService = new ExportService();
const cacheService = getCacheService();

const router = Router();

/**
 * GET /api/download
 * Export fair value data in CSV or PDF format (Pro only)
 * Requirements: 9.4, 9.5
 */
router.get('/download', requireAuth, requirePro, async (req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();

    // Validate query parameters
    const querySchema = z.object({
      format: z.enum(['csv', 'pdf'], {
        errorMap: () => ({ message: 'Format must be either "csv" or "pdf"' }),
      }),
      tickers: z.string().min(1, 'At least one ticker is required'),
    });

    const { format, tickers: tickersParam } = querySchema.parse(req.query);

    // Parse tickers (comma-separated)
    const tickers = tickersParam
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    if (tickers.length === 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one valid ticker is required',
          details: {},
        },
      });
      return;
    }

    // Limit to 50 stocks for performance
    if (tickers.length > 50) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Maximum 50 stocks allowed for export',
          details: { count: tickers.length },
        },
      });
      return;
    }

    logger.info(`Exporting ${tickers.length} stocks in ${format} format for user ${req.user?.id}`);

    // Fetch fair value data for all tickers
    const fairValuePromises = tickers.map(async (ticker) => {
      try {
        // Check cache first
        const cacheKey = CacheKeys.fairValue(ticker);
        const cachedResult = await cacheService.get(cacheKey);

        if (cachedResult) {
          return cachedResult;
        }

        // Calculate fair value
        const fairValueResult = await valuationService.calculateAllModels(ticker);
        return fairValueResult;
      } catch (error: any) {
        logger.warn(`Failed to get fair value for ${ticker}: ${error.message}`);
        return null;
      }
    });

    // Wait for all calculations (with 5 second timeout)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Export generation timeout')), 5000);
    });

    let fairValueResults;
    try {
      fairValueResults = await Promise.race([
        Promise.all(fairValuePromises),
        timeoutPromise,
      ]);
    } catch (error) {
      res.status(504).json({
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Export generation exceeded 5 second limit',
          details: {},
        },
      });
      return;
    }

    // Filter out failed results
    const validResults = (fairValueResults as any[]).filter((r) => r !== null);

    if (validResults.length === 0) {
      res.status(404).json({
        error: {
          code: 'NO_DATA_ERROR',
          message: 'No valid data available for export',
          details: {},
        },
      });
      return;
    }

    // Generate export based on format
    if (format === 'csv') {
      const csv = exportService.generateCSV(validResults);

      const responseTime = Date.now() - startTime;
      logger.info(`CSV export generated in ${responseTime}ms for ${validResults.length} stocks`);

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="stockmeter-export-${Date.now()}.csv"`);
      res.status(200).send(csv);
    } else if (format === 'pdf') {
      const pdfBuffer = await exportService.generatePDF(validResults);

      const responseTime = Date.now() - startTime;
      logger.info(`PDF export generated in ${responseTime}ms for ${validResults.length} stocks`);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="stockmeter-export-${Date.now()}.pdf"`);
      res.status(200).send(pdfBuffer);
    }
  } catch (error: any) {
    logger.error('Error generating export:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to generate export',
        details: { originalError: error.message },
      },
    });
  }
});

export default router;
