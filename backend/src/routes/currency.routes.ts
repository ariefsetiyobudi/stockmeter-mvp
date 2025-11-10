import { Router, Request, Response } from 'express';
import { CurrencyService } from '../services/currency.service';
import { z } from 'zod';

const router = Router();
const currencyService = new CurrencyService();

// Validation schemas
const convertSchema = z.object({
  amount: z.number().positive(),
  from: z.string().length(3),
  to: z.string().length(3),
});

/**
 * GET /api/currency/rates
 * Get current exchange rates
 */
router.get('/rates', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rates = await currencyService.getExchangeRates();

    res.status(200).json({
      data: rates,
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get exchange rates',
        details: {},
      },
    });
  }
});

/**
 * POST /api/currency/convert
 * Convert amount between currencies
 */
router.post('/convert', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = convertSchema.parse(req.body);

    const convertedAmount = await currencyService.convertCurrency(
      validatedData.amount,
      validatedData.from,
      validatedData.to
    );

    res.status(200).json({
      data: {
        originalAmount: validatedData.amount,
        originalCurrency: validatedData.from,
        convertedAmount,
        targetCurrency: validatedData.to,
        formatted: currencyService.formatCurrency(convertedAmount, validatedData.to),
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

    console.error('Currency conversion error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to convert currency',
        details: {},
      },
    });
  }
});

export default router;
