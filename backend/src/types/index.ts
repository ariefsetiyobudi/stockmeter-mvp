// Global type definitions for the Stockmeter backend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'free' | 'pro' | 'expired';
  subscriptionExpiry: Date | null;
  languagePreference: string;
  currencyPreference: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Financial data types
export interface StockSearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

export interface StockProfile {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  marketCap: number;
  sharesOutstanding: number;
}

export interface StockPrice {
  ticker: string;
  price: number;
  currency: string;
  timestamp: Date;
}

export interface FinancialStatement {
  date: string;
  revenue: number;
  netIncome: number;
  ebitda: number;
  eps: number;
  totalAssets: number;
  totalLiabilities: number;
  bookValue: number;
  freeCashFlow: number;
  capex: number;
  workingCapital: number;
  dividendPerShare: number;
}

export interface FinancialStatements {
  ticker: string;
  period: 'annual' | 'quarterly';
  statements: FinancialStatement[];
}

export interface IndustryPeer {
  ticker: string;
  name: string;
  marketCap: number;
  pe: number;
  pb: number;
  ps: number;
  peRatio?: number | null;
  pbRatio?: number | null;
  psRatio?: number | null;
  sector?: string;
  industry?: string;
}

// Valuation types
export interface DCFResult {
  fairValue: number;
  assumptions: {
    revenueGrowthRate: number;
    wacc: number;
    terminalGrowthRate: number;
    projectionYears: number;
    fcfMargin?: number;
  };
  projectedCashFlows: number[];
}

export interface DDMResult {
  fairValue: number | null;
  assumptions: {
    dividendGrowthRate: number;
    discountRate: number;
  };
  applicable: boolean;
}

export interface RelativeValueResult {
  peRatioFairValue: number | null;
  pbRatioFairValue: number | null;
  psRatioFairValue: number | null;
  companyMetrics: {
    pe: number | null;
    pb: number | null;
    ps: number | null;
  };
  industryMedians: {
    pe: number | null;
    pb: number | null;
    ps: number | null;
  };
}

export interface GrahamResult {
  fairValue: number | null;
  assumptions: {
    eps: number;
    bookValuePerShare: number;
  };
  applicable: boolean;
}

export interface FairValueResult {
  ticker: string;
  currentPrice: number;
  dcf: DCFResult | null;
  ddm: DDMResult | null;
  relativeValue: RelativeValueResult | null;
  graham: GrahamResult | null;
  valuationStatus: 'undervalued' | 'fairly_priced' | 'overvalued';
  calculatedAt: Date;
}

// Payment types
export interface SubscriptionPlan {
  type: 'monthly' | 'yearly';
  price: number;
  currency: string;
}

export interface PaymentSession {
  sessionId: string;
  checkoutUrl: string;
}

export type PaymentProvider = 'stripe' | 'paypal' | 'midtrans';

export interface SubscriptionStatus {
  status: 'free' | 'pro' | 'expired';
  expiryDate: Date | null;
  autoRenew: boolean;
}

// Alert types
export interface AlertConfig {
  ticker: string;
  thresholdType: 'undervalued' | 'overvalued' | 'fair';
  thresholdValue: number;
}

export interface Alert {
  id: string;
  userId: string;
  ticker: string;
  thresholdType: string;
  thresholdValue: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

// Error types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(503, `${service} error: ${message}`);
  }
}