import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    subscriptionStatus: string;
    subscriptionExpiry: Date | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  /**
   * Register a new user with email and password
   */
  async registerUser(email: string, password: string, name: string): Promise<User> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password with 10 rounds
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        authProvider: 'email',
        subscriptionStatus: 'free',
      },
    });

    return user;
  }

  /**
   * Login user with email and password
   */
  async loginUser(email: string, password: string): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new Error('Please use social login for this account');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with Google OAuth
   */
  async loginWithGoogle(googleUser: any): Promise<AuthResult> {
    const email = googleUser.email;
    
    if (!email) {
      throw new Error('No email found in Google profile');
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: googleUser.name || 'Google User',
          authProvider: 'google',
          passwordHash: null,
          subscriptionStatus: 'free',
        },
      });
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with social provider (Facebook, etc.)
   */
  async loginWithSocial(provider: string, socialUser: any): Promise<AuthResult> {
    const email = socialUser.email;
    
    if (!email) {
      throw new Error(`No email found in ${provider} profile`);
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: socialUser.name || `${provider} User`,
          authProvider: provider,
          passwordHash: null,
          subscriptionStatus: 'free',
        },
      });
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user.id, user.email);
      const newRefreshToken = this.generateRefreshToken(user.id, user.email);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiry: user.subscriptionExpiry,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      throw error;
    }
  }

  /**
   * Generate access token (1 hour expiry)
   */
  private generateAccessToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'access',
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);
  }

  /**
   * Generate refresh token (30 days expiry)
   */
  private generateRefreshToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'refresh',
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions);
  }
}

export default new AuthService();
