// Common types and interfaces

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'free' | 'pro' | 'expired';
  subscriptionExpiry: Date | null;
  createdAt: Date;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type PaymentProvider = 'stripe' | 'paypal' | 'midtrans';

export interface SubscriptionPlan {
  type: 'monthly' | 'yearly';
  price: number;
  currency: string;
}

// Financial Data Provider Types

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
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number | null;
  pbRatio: number | null;
  psRatio: number | null;
}

// Financial Data Provider Interface

export interface IFinancialDataProvider {
  searchStocks(query: string): Promise<StockSearchResult[]>;
  getStockProfile(ticker: string): Promise<StockProfile>;
  getStockPrice(ticker: string): Promise<StockPrice>;
  getFinancials(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatements>;
  getIndustryPeers(ticker: string): Promise<IndustryPeer[]>;
}

// Valuation Types

export interface DCFResult {
  fairValue: number;
  assumptions: {
    revenueGrowthRate: number;
    wacc: number;
    terminalGrowthRate: number;
    projectionYears: number;
    fcfMargin: number;
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

// Valuation Service Interface

export interface IValuationService {
  calculateDCF(ticker: string, financials: FinancialStatements, profile: StockProfile): Promise<DCFResult | null>;
  calculateDDM(ticker: string, financials: FinancialStatements, profile: StockProfile): Promise<DDMResult | null>;
  calculateRelativeValue(ticker: string, financials: FinancialStatements, peers: IndustryPeer[], profile: StockProfile): Promise<RelativeValueResult | null>;
  calculateGrahamNumber(ticker: string, financials: FinancialStatements, profile: StockProfile): Promise<GrahamResult | null>;
  calculateAllModels(ticker: string): Promise<FairValueResult>;
}
