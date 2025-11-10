import { Router, Request, Response } from 'express';
import { paymentService } from '../services';
import { requireAuth } from '../middleware/auth.middleware';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const subscribeSchema = z.object({
  planType: z.enum(['monthly', 'yearly']),
  provider: z.enum(['stripe', 'paypal', 'midtrans']),
});

/**
 * POST /api/payments/subscribe
 * Create a subscription checkout session
 */
router.post('/subscribe', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // Validate request body
    const validation = subscribeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.error.errors,
        },
      });
    }

    const { planType, provider } = validation.data;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Create subscription session
    const session = await paymentService.createSubscription(
      userId,
      user.email,
      user.name,
      planType,
      provider
    );

    logger.info(`Subscription session created for user ${userId} with ${provider}`);

    return res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        checkoutUrl: session.checkoutUrl,
        provider: session.provider,
      },
    });
  } catch (error: any) {
    logger.error('Subscription creation error:', error);
    return res.status(500).json({
      error: {
        code: 'SUBSCRIPTION_ERROR',
        message: error.message || 'Failed to create subscription',
      },
    });
  }
});

/**
 * GET /api/user/subscription
 * Get current user's subscription status
 */
router.get('/subscription', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionExpiry: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Check if subscription is expired
    let status = user.subscriptionStatus;
    if (
      status === 'pro' &&
      user.subscriptionExpiry &&
      new Date(user.subscriptionExpiry) < new Date()
    ) {
      status = 'expired';
      // Update status in database
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'expired' },
      });
    }

    return res.json({
      status,
      expiryDate: user.subscriptionExpiry,
      autoRenew: status === 'pro', // Simplified - in production, track this separately
    });
  } catch (error: any) {
    logger.error('Subscription status fetch error:', error);
    return res.status(500).json({
      error: {
        code: 'SUBSCRIPTION_STATUS_ERROR',
        message: 'Failed to fetch subscription status',
      },
    });
  }
});

export default router;
