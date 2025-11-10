import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import passport from './config/passport';
import authRoutes from './routes/auth.routes';
import stocksRoutes from './routes/stocks.routes';
import watchlistRoutes from './routes/watchlist.routes';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import alertRoutes from './routes/alert.routes';
import exportRoutes from './routes/export.routes';
import userRoutes from './routes/user.routes';
import currencyRoutes from './routes/currency.routes';
import { ProviderManager } from './adapters';
import { initializeAlertScheduler } from './services/alert-scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(compression());

// Webhook routes need raw body for signature verification
app.use('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user', watchlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user', paymentRoutes); // For /api/user/subscription endpoint
app.use('/api/payments', webhookRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api', exportRoutes);
app.use('/api/currency', currencyRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      details: err.details || {}
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Initialize alert scheduler
  const providerManager = new ProviderManager();
  initializeAlertScheduler(providerManager);
  console.log('📧 Alert scheduler initialized');
});

export default app;
