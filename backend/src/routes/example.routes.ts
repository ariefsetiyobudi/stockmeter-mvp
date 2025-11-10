import { Router, Request, Response } from 'express';
import { requireAuth, requirePro } from '../middleware/auth.middleware';

const router = Router();

/**
 * Example: Public endpoint (no authentication required)
 */
router.get('/public', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    message: 'This is a public endpoint',
    data: {
      info: 'Anyone can access this',
    },
  });
});

/**
 * Example: Protected endpoint (authentication required)
 */
router.get('/protected', requireAuth, async (req: Request, res: Response): Promise<void> => {
  res.json({
    message: 'This is a protected endpoint',
    data: {
      user: {
        id: req.user?.id,
        email: req.user?.email,
        name: req.user?.name,
        subscriptionStatus: req.user?.subscriptionStatus,
      },
    },
  });
});

/**
 * Example: Pro-only endpoint (Pro subscription required)
 */
router.get('/pro-only', requireAuth, requirePro, async (req: Request, res: Response): Promise<void> => {
  res.json({
    message: 'This is a Pro-only endpoint',
    data: {
      user: {
        id: req.user?.id,
        email: req.user?.email,
        name: req.user?.name,
        subscriptionStatus: req.user?.subscriptionStatus,
        subscriptionExpiry: req.user?.subscriptionExpiry,
      },
      feature: 'Advanced analytics available',
    },
  });
});

export default router;
