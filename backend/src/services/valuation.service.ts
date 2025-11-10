import {
  IValuationService,
  DCFResult,
  DDMResult,
  RelativeValueResult,
  GrahamResult,
  FairValueResult,
  FinancialStatements,
  StockProfile,
  IndustryPeer,
} from '../types';
import { ProviderManager } from '../adapters';
import { getCacheService } from './cache.service';
import { CacheKeys } from '../utils/cache-keys';
import { createLogger } from '../utils/logger';

const logger = createLogger('ValuationService');

/**
 * ValuationService calculates fair value using multiple valuation models
 */
export class ValuationService implements IValuationService {
  private providerManager: ProviderManager;
  private cacheService = getCacheService();

  constructor(providerManager: ProviderManager) {
    this.providerManager = providerManager;
  }

  /**
   * Calculate DCF (Discounted Cash Flow) fair value
   * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
   */
  async calculateDCF(
    ticker: string,
    financials: FinancialStatements,
    profile: StockProfile
  ): Promise<DCFResult | null> {
    try {
      logger.info(`Calculating DCF for ${ticker}`);

      // Need at least 5 years of data
      if (financials.statements.length < 5) {
        logger.warn(`Insufficient data for DCF calculation: ${financials.statements.length} years`);
        return null;
      }

      // Sort statements by date (oldest first)
      const sortedStatements = [...financials.statements].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate historical revenue CAGR (5-year)
      const revenueGrowthRate = this.calculateCAGR(
        sortedStatements.slice(-5).map(s => s.revenue)
      );

      if (revenueGrowthRate === null || revenueGrowthRate < -0.5 || revenueGrowthRate > 1.0) {
        logger.warn(`Invalid revenue growth rate: ${revenueGrowthRate}`);
        return null;
      }

      // Calculate historical FCF margin average
      const fcfMargins = sortedStatements
        .slice(-5)
        .map(s => s.revenue > 0 ? s.freeCashFlow / s.revenue : 0)
        .filter(margin => !isNaN(margin) && isFinite(margin));

      if (fcfMargins.length === 0) {
        logger.warn('No valid FCF margins found');
        return null;
      }

      const fcfMargin = fcfMargins.reduce((sum, m) => sum + m, 0) / fcfMargins.length;

      // Determine WACC based on sector (8-12% range)
      const wacc = this.determineWACC(profile.sector);

      // Project 10-year revenue and FCF
      const projectionYears = 10;
      const latestRevenue = sortedStatements[sortedStatements.length - 1].revenue;
      const projectedCashFlows: number[] = [];

      for (let year = 1; year <= projectionYears; year++) {
        const projectedRevenue = latestRevenue * Math.pow(1 + revenueGrowthRate, year);
        const projectedFCF = projectedRevenue * fcfMargin;
        projectedCashFlows.push(projectedFCF);
      }

      // Calculate terminal value with 2-3% perpetual growth
      const terminalGrowthRate = 0.025; // 2.5%
      const terminalFCF = projectedCashFlows[projectedCashFlows.length - 1] * (1 + terminalGrowthRate);
      const terminalValue = terminalFCF / (wacc - terminalGrowthRate);

      // Discount cash flows to present value
      let presentValue = 0;
      for (let year = 1; year <= projectionYears; year++) {
        const discountedCF = projectedCashFlows[year - 1] / Math.pow(1 + wacc, year);
        presentValue += discountedCF;
      }

      // Discount terminal value
      const discountedTerminalValue = terminalValue / Math.pow(1 + wacc, projectionYears);
      presentValue += discountedTerminalValue;

      // Calculate per-share fair value
      const fairValue = presentValue / profile.sharesOutstanding;

      logger.info(`DCF calculated for ${ticker}: $${fairValue.toFixed(2)}`);

      return {
        fairValue,
        assumptions: {
          revenueGrowthRate,
          wacc,
          terminalGrowthRate,
          projectionYears,
          fcfMargin,
        },
        projectedCashFlows,
      };
    } catch (error) {
      logger.error(`Error calculating DCF for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Calculate DDM (Dividend Discount Model) fair value
   * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
   */
  async calculateDDM(
    ticker: string,
    financials: FinancialStatements,
    _profile: StockProfile
  ): Promise<DDMResult | null> {
    try {
      logger.info(`Calculating DDM for ${ticker}`);

      // Check if stock pays dividends (last 3 years)
      const recentStatements = financials.statements.slice(-3);
      
      if (recentStatements.length < 3) {
        logger.warn(`Insufficient data for DDM calculation: ${recentStatements.length} years`);
        return {
          fairValue: null,
          assumptions: {
            dividendGrowthRate: 0,
            discountRate: 0,
          },
          applicable: false,
        };
      }

      const dividends = recentStatements.map(s => s.dividendPerShare);
      const hasDividends = dividends.every(d => d > 0);

      if (!hasDividends) {
        logger.info(`${ticker} does not pay consistent dividends`);
        return {
          fairValue: null,
          assumptions: {
            dividendGrowthRate: 0,
            discountRate: 0,
          },
          applicable: false,
        };
      }

      // Calculate dividend CAGR
      const dividendGrowthRate = this.calculateCAGR(dividends);

      if (dividendGrowthRate === null || dividendGrowthRate < 0 || dividendGrowthRate > 0.5) {
        logger.warn(`Invalid dividend growth rate: ${dividendGrowthRate}`);
        return {
          fairValue: null,
          assumptions: {
            dividendGrowthRate: 0,
            discountRate: 0,
          },
          applicable: false,
        };
      }

      // Use required return 8-12% (use 10% as default)
      const discountRate = 0.10;

      // Apply Gordon Growth Model: D1 / (r - g)
      const latestDividend = dividends[dividends.length - 1];
      const nextDividend = latestDividend * (1 + dividendGrowthRate);

      if (discountRate <= dividendGrowthRate) {
        logger.warn(`Discount rate (${discountRate}) must be greater than growth rate (${dividendGrowthRate})`);
        return {
          fairValue: null,
          assumptions: {
            dividendGrowthRate,
            discountRate,
          },
          applicable: false,
        };
      }

      const fairValue = nextDividend / (discountRate - dividendGrowthRate);

      logger.info(`DDM calculated for ${ticker}: $${fairValue.toFixed(2)}`);

      return {
        fairValue,
        assumptions: {
          dividendGrowthRate,
          discountRate,
        },
        applicable: true,
      };
    } catch (error) {
      logger.error(`Error calculating DDM for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Calculate relative valuation using industry peer ratios
   * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
   */
  async calculateRelativeValue(
    ticker: string,
    financials: FinancialStatements,
    peers: IndustryPeer[],
    profile: StockProfile
  ): Promise<RelativeValueResult | null> {
    try {
      logger.info(`Calculating relative valuation for ${ticker}`);

      // Need at least 10 peers
      if (peers.length < 10) {
        logger.warn(`Insufficient peers for relative valuation: ${peers.length}`);
        return null;
      }

      // Get latest financial statement
      const latestStatement = financials.statements[financials.statements.length - 1];

      // Calculate company metrics
      const companyPE = latestStatement.eps > 0 
        ? profile.marketCap / (latestStatement.eps * profile.sharesOutstanding)
        : null;
      
      const companyPB = latestStatement.bookValue > 0
        ? profile.marketCap / latestStatement.bookValue
        : null;
      
      const companyPS = latestStatement.revenue > 0
        ? profile.marketCap / latestStatement.revenue
        : null;

      // Calculate industry medians
      const peerPEs = peers.map(p => p.peRatio).filter(r => r !== null && r > 0) as number[];
      const peerPBs = peers.map(p => p.pbRatio).filter(r => r !== null && r > 0) as number[];
      const peerPSs = peers.map(p => p.psRatio).filter(r => r !== null && r > 0) as number[];

      const medianPE = peerPEs.length > 0 ? this.calculateMedian(peerPEs) : null;
      const medianPB = peerPBs.length > 0 ? this.calculateMedian(peerPBs) : null;
      const medianPS = peerPSs.length > 0 ? this.calculateMedian(peerPSs) : null;

      // Calculate fair values using industry medians
      const peRatioFairValue = medianPE && latestStatement.eps > 0
        ? medianPE * latestStatement.eps
        : null;

      const pbRatioFairValue = medianPB && latestStatement.bookValue > 0
        ? (medianPB * latestStatement.bookValue) / profile.sharesOutstanding
        : null;

      const psRatioFairValue = medianPS && latestStatement.revenue > 0
        ? (medianPS * latestStatement.revenue) / profile.sharesOutstanding
        : null;

      logger.info(`Relative valuation calculated for ${ticker}`);

      return {
        peRatioFairValue,
        pbRatioFairValue,
        psRatioFairValue,
        companyMetrics: {
          pe: companyPE,
          pb: companyPB,
          ps: companyPS,
        },
        industryMedians: {
          pe: medianPE,
          pb: medianPB,
          ps: medianPS,
        },
      };
    } catch (error) {
      logger.error(`Error calculating relative valuation for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Calculate Graham Number
   * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
   */
  async calculateGrahamNumber(
    ticker: string,
    financials: FinancialStatements,
    profile: StockProfile
  ): Promise<GrahamResult | null> {
    try {
      logger.info(`Calculating Graham Number for ${ticker}`);

      // Get latest financial statement
      const latestStatement = financials.statements[financials.statements.length - 1];

      const eps = latestStatement.eps;
      const bookValuePerShare = latestStatement.bookValue / profile.sharesOutstanding;

      // Return null if EPS or book value is negative
      if (eps <= 0 || bookValuePerShare <= 0) {
        logger.info(`${ticker} has negative EPS or book value, Graham Number not applicable`);
        return {
          fairValue: null,
          assumptions: {
            eps,
            bookValuePerShare,
          },
          applicable: false,
        };
      }

      // Apply Graham formula: √(22.5 × EPS × BVPS)
      const fairValue = Math.sqrt(22.5 * eps * bookValuePerShare);

      logger.info(`Graham Number calculated for ${ticker}: $${fairValue.toFixed(2)}`);

      return {
        fairValue,
        assumptions: {
          eps,
          bookValuePerShare,
        },
        applicable: true,
      };
    } catch (error) {
      logger.error(`Error calculating Graham Number for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Calculate all valuation models and determine valuation status
   * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6
   */
  async calculateAllModels(ticker: string): Promise<FairValueResult> {
    try {
      logger.info(`Calculating all models for ${ticker}`);

      // Check cache first
      const cacheKey = CacheKeys.fairValue(ticker);
      const cached = await this.cacheService.get<FairValueResult>(cacheKey);
      
      if (cached) {
        logger.info(`Returning cached fair value for ${ticker}`);
        return cached;
      }

      // Fetch required data
      const [stockProfile, price, financials, peers] = await Promise.all([
        this.providerManager.executeWithFailover(p => p.getStockProfile(ticker)),
        this.providerManager.executeWithFailover(p => p.getStockPrice(ticker)),
        this.providerManager.executeWithFailover(p => p.getFinancials(ticker, 'annual')),
        this.providerManager.executeWithFailover(p => p.getIndustryPeers(ticker)),
      ]);

      // Calculate all models
      const [dcf, ddm, relativeValue, graham] = await Promise.all([
        this.calculateDCF(ticker, financials, stockProfile),
        this.calculateDDM(ticker, financials, stockProfile),
        this.calculateRelativeValue(ticker, financials, peers, stockProfile),
        this.calculateGrahamNumber(ticker, financials, stockProfile),
      ]);

      // Determine valuation status based on 10% threshold
      const valuationStatus = this.determineValuationStatus(price.price, [
        dcf?.fairValue,
        ddm?.fairValue,
        relativeValue?.peRatioFairValue,
        relativeValue?.pbRatioFairValue,
        relativeValue?.psRatioFairValue,
        graham?.fairValue,
      ]);

      const result: FairValueResult = {
        ticker,
        currentPrice: price.price,
        dcf,
        ddm,
        relativeValue,
        graham,
        valuationStatus,
        calculatedAt: new Date(),
      };

      // Cache result for 1 hour (3600 seconds)
      await this.cacheService.set(cacheKey, result, 3600);

      logger.info(`All models calculated for ${ticker}, status: ${valuationStatus}`);

      return result;
    } catch (error) {
      logger.error(`Error calculating all models for ${ticker}:`, error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Calculate CAGR (Compound Annual Growth Rate)
   */
  private calculateCAGR(values: number[]): number | null {
    if (values.length < 2) return null;

    const startValue = values[0];
    const endValue = values[values.length - 1];
    const years = values.length - 1;

    if (startValue <= 0 || endValue <= 0) return null;

    const cagr = Math.pow(endValue / startValue, 1 / years) - 1;
    return cagr;
  }

  /**
   * Determine WACC based on sector (8-12% range)
   */
  private determineWACC(sector: string): number {
    const sectorWACC: { [key: string]: number } = {
      'Technology': 0.10,
      'Healthcare': 0.09,
      'Financial Services': 0.08,
      'Consumer Cyclical': 0.11,
      'Consumer Defensive': 0.08,
      'Industrials': 0.10,
      'Energy': 0.11,
      'Utilities': 0.08,
      'Real Estate': 0.09,
      'Basic Materials': 0.11,
      'Communication Services': 0.10,
    };

    return sectorWACC[sector] || 0.10; // Default 10%
  }

  /**
   * Calculate median of an array
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Determine valuation status based on fair values and current price
   */
  private determineValuationStatus(
    currentPrice: number,
    fairValues: (number | null | undefined)[]
  ): 'undervalued' | 'fairly_priced' | 'overvalued' {
    // Filter out null/undefined values
    const validFairValues = fairValues.filter(v => v !== null && v !== undefined && v > 0) as number[];

    if (validFairValues.length === 0) {
      return 'fairly_priced';
    }

    // Calculate average fair value
    const avgFairValue = validFairValues.reduce((sum, v) => sum + v, 0) / validFairValues.length;

    // 10% threshold
    const threshold = 0.10;

    if (avgFairValue > currentPrice * (1 + threshold)) {
      return 'undervalued';
    } else if (currentPrice > avgFairValue * (1 + threshold)) {
      return 'overvalued';
    } else {
      return 'fairly_priced';
    }
  }
}

export default ValuationService;
