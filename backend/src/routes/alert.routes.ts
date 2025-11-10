import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requirePro } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createAlertSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
  thresholdType: z.enum(['undervalued', 'overvalued', 'fair']),
  thresholdValue: z.number().min(0).max(100),
});

const updateAlertSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

/**
 * POST /api/alerts
 * Create a new alert
 * Requires Pro subscription
 */
router.post('/', requireAuth, requirePro, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validationResult = createAlertSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid alert data',
          details: validationResult.error.errors,
        },
      });
      return;
    }

    const { ticker, thresholdType, thresholdValue } = validationResult.data;

    // Check if alert already exists for this user and ticker
    const existingAlert = await prisma.alert.findFirst({
      where: {
        userId: req.user!.id,
        ticker,
        thresholdType,
      },
    });

    if (existingAlert) {
      res.status(409).json({
        error: {
          code: 'ALERT_EXISTS',
          message: 'An alert with the same ticker and threshold type already exists',
          details: {},
        },
      });
      return;
    }

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        userId: req.user!.id,
        ticker,
        thresholdType,
        thresholdValue,
        status: 'active',
      },
    });

    res.status(201).json({
      data: alert,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create alert',
        details: {},
      },
    });
  }
});

/**
 * GET /api/alerts
 * Fetch user's alerts
 * Requires Pro subscription
 */
router.get('/', requireAuth, requirePro, async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await prisma.alert.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      data: alerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch alerts',
        details: {},
      },
    });
  }
});

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 * Requires Pro subscription
 */
router.delete('/:id', requireAuth, requirePro, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if alert exists and belongs to user
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      res.status(404).json({
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found',
          details: {},
        },
      });
      return;
    }

    if (alert.userId !== req.user!.id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this alert',
          details: {},
        },
      });
      return;
    }

    // Delete alert
    await prisma.alert.delete({
      where: { id },
    });

    res.json({
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete alert',
        details: {},
      },
    });
  }
});

/**
 * PATCH /api/alerts/:id
 * Update alert status (activate/deactivate)
 * Requires Pro subscription
 */
router.patch('/:id', requireAuth, requirePro, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const validationResult = updateAlertSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status value',
          details: validationResult.error.errors,
        },
      });
      return;
    }

    const { status } = validationResult.data;

    // Check if alert exists and belongs to user
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      res.status(404).json({
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found',
          details: {},
        },
      });
      return;
    }

    if (alert.userId !== req.user!.id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this alert',
          details: {},
        },
      });
      return;
    }

    // Update alert status
    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: { status },
    });

    res.json({
      data: updatedAlert,
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update alert',
        details: {},
      },
    });
  }
});

export default router;
