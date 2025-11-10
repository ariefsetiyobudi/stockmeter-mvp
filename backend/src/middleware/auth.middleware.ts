import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User as PrismaUser } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express types to include our Prisma User
declare module 'express-serve-static-core' {
  interface Request {
    user?: PrismaUser;
  }
}

interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to request
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
          details: {},
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired',
            details: {},
          },
        });
        return;
      }
      
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          details: {},
        },
      });
      return;
    }

    // Check token type
    if (decoded.type !== 'access') {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
          details: {},
        },
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          details: {},
        },
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during authentication',
        details: {},
      },
    });
  }
};

/**
 * Middleware to require Pro subscription
 * Must be used after requireAuth middleware
 */
export const requirePro = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is attached (requireAuth should be called first)
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

    // Check subscription status
    if (req.user.subscriptionStatus !== 'pro') {
      res.status(403).json({
        error: {
          code: 'PRO_SUBSCRIPTION_REQUIRED',
          message: 'This feature requires a Pro subscription',
          details: {
            currentStatus: req.user.subscriptionStatus,
            upgradeUrl: '/pricing',
          },
        },
      });
      return;
    }

    // Check if subscription is expired
    if (req.user.subscriptionExpiry && req.user.subscriptionExpiry < new Date()) {
      // Update status to expired
      await prisma.user.update({
        where: { id: req.user.id },
        data: { subscriptionStatus: 'expired' },
      });

      res.status(403).json({
        error: {
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Your Pro subscription has expired',
          details: {
            expiryDate: req.user.subscriptionExpiry,
            renewUrl: '/pricing',
          },
        },
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during authorization',
        details: {},
      },
    });
  }
};
