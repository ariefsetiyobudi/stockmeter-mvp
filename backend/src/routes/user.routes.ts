import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const preferencesSchema = z.object({
  languagePreference: z.string().optional(),
  currencyPreference: z.string().optional(),
});

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
        languagePreference: true,
        currencyPreference: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          details: {},
        },
      });
      return;
    }

    res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user profile',
        details: {},
      },
    });
  }
});

/**
 * PATCH /api/user/preferences
 * Update user preferences (language, currency)
 */
router.patch('/preferences', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    // Validate request body
    const validatedData = preferencesSchema.parse(req.body);

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validatedData.languagePreference && { languagePreference: validatedData.languagePreference }),
        ...(validatedData.currencyPreference && { currencyPreference: validatedData.currencyPreference }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
        languagePreference: true,
        currencyPreference: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      message: 'Preferences updated successfully',
      data: updatedUser,
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

    console.error('Update preferences error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update preferences',
        details: {},
      },
    });
  }
});

export default router;
