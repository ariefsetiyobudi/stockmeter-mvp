// Frontend type definitions for Stockmeter

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

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isPro: boolean;
  isLoading: boolean;
}

// Stock data types
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

// Valuation types
export interface DCFResult {
  fairValue: number;
  assumptions: {
    revenueGrowthRate: number;
    wacc: number;
    terminalGrowthRate: number;
    projectionYears: number;
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
  peRatioFairValue: number;
  pbRatioFairValue: number;
  psRatioFairValue: number;
  companyMetrics: {
    pe: number;
    pb: number;
    ps: number;
  };
  industryMedians: {
    pe: number;
    pb: number;
    ps: number;
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
  dcf: DCFResult;
  ddm: DDMResult;
  relativeValue: RelativeValueResult;
  graham: GrahamResult;
  valuationStatus: 'undervalued' | 'fairly_priced' | 'overvalued';
  calculatedAt: Date;
}

// UI Component types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AlertFormData {
  ticker: string;
  thresholdType: 'undervalued' | 'overvalued' | 'fair';
  thresholdValue: number;
}

// API Response types
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

// Store types
export interface WatchlistState {
  watchlist: string[];
  isLoading: boolean;
  error: string | null;
}

export interface ComparisonState {
  selectedStocks: string[];
  comparisonData: FairValueResult[];
  isLoading: boolean;
  error: string | null;
}

// Subscription types
export interface SubscriptionPlan {
  type: 'monthly' | 'yearly';
  price: number;
  currency: string;
  features: string[];
}

export interface PaymentProvider {
  id: 'stripe' | 'paypal' | 'midtrans';
  name: string;
  logo: string;
  supported: boolean;
}

// Internationalization types
export interface LocaleConfig {
  code: string;
  name: string;
  flag: string;
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
}

// Chart types
export interface ChartDataPoint {
  date: string;
  price: number;
  fairValue?: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area';
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

// Utility types
export type ValuationStatus = 'undervalued' | 'fairly_priced' | 'overvalued';
export type SubscriptionStatus = 'free' | 'pro' | 'expired';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}