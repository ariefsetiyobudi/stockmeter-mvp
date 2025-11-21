import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import routes
import authRoutes from './routes/auth.routes';
import stocksRoutes from './routes/stocks.routes';
import userRoutes from './routes/user.routes';
import watchlistRoutes from './routes/watchlist.routes';
import alertRoutes from './routes/alert.routes';
import paymentRoutes from './routes/payment.routes';
import exportRoutes from './routes/export.routes';
import webhookRoutes from './routes/webhook.routes';
import currencyRoutes from './routes/currency.routes';

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Stockmeter API',
    version: '1.0.0',
    status: 'running'
  });
});

// Register routes
app.use('/auth', authRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/user', userRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/currency', currencyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;