// Common types and interfaces

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'free' | 'pro' | 'expired';
  subscriptionExpiry: Date | null;
  languagePreference?: string;
  currencyPreference?: string;
  createdAt: Date;
}

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

export interface StockDetail {
  profile: StockProfile;
  price: StockPrice;
}

export interface ModelDetails {
  ticker: string;
  dcf: DCFResult & {
    detailedSteps: string[];
    projectedRevenue: number[];
    projectedFCF: number[];
  };
  ddm: DDMResult & {
    detailedSteps: string[];
    historicalDividends: number[];
  };
  relativeValue: RelativeValueResult & {
    detailedSteps: string[];
    peerComparisons: Array<{
      ticker: string;
      name: string;
      pe: number;
      pb: number;
      ps: number;
    }>;
  };
  graham: GrahamResult & {
    detailedSteps: string[];
  };
}

export interface Transaction {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  createdAt: Date;
}

export interface SubscriptionPlan {
  type: 'monthly' | 'yearly';
  price: number;
  currency: string;
}
