import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import authService from '../services/auth.service';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Register user
    await authService.registerUser(
      validatedData.email,
      validatedData.password,
      validatedData.name
    );

    // Auto-login after registration
    const authResult = await authService.loginUser(
      validatedData.email,
      validatedData.password
    );

    res.status(201).json({
      message: 'User registered successfully',
      data: authResult,
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

    if (error.message === 'User with this email already exists') {
      res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: error.message,
          details: {},
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register user',
        details: {},
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const authResult = await authService.loginUser(
      validatedData.email,
      validatedData.password
    );

    res.status(200).json({
      message: 'Login successful',
      data: authResult,
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

    if (
      error.message === 'Invalid email or password' ||
      error.message === 'Please use social login for this account'
    ) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: error.message,
          details: {},
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to login',
        details: {},
      },
    });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
        return;
      }

      // Generate tokens
      const authResult = await authService.loginWithGoogle(req.user);

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(
        `${frontendUrl}/auth/callback?accessToken=${authResult.accessToken}&refreshToken=${authResult.refreshToken}`
      );
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }
  }
);

/**
 * GET /api/auth/facebook
 * Initiate Facebook OAuth flow
 */
router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: ['email'],
    session: false,
  })
);

/**
 * GET /api/auth/facebook/callback
 * Facebook OAuth callback
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
        return;
      }

      // Generate tokens
      const authResult = await authService.loginWithSocial('facebook', req.user);

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(
        `${frontendUrl}/auth/callback?accessToken=${authResult.accessToken}&refreshToken=${authResult.refreshToken}`
      );
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = refreshTokenSchema.parse(req.body);

    // Refresh token
    const authResult = await authService.refreshToken(validatedData.refreshToken);

    res.status(200).json({
      message: 'Token refreshed successfully',
      data: authResult,
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

    if (
      error.message === 'Invalid refresh token' ||
      error.message === 'Refresh token expired' ||
      error.message === 'User not found'
    ) {
      res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: error.message,
          details: {},
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh token',
        details: {},
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  // In a JWT-based system, logout is primarily handled client-side
  // by removing the tokens. This endpoint is here for consistency
  // and can be extended for token blacklisting if needed.
  
  res.status(200).json({
    message: 'Logout successful',
  });
});

export default router;
