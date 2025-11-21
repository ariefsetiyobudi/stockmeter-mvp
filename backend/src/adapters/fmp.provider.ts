import axios, { AxiosInstance } from 'axios';
import {
  StockSearchResult,
  StockProfile,
  StockPrice,
  FinancialStatements,
  FinancialStatement,
  IndustryPeer,
} from '../types';
import { logger } from '../utils/logger';

/**
 * Financial Modeling Prep Provider
 * 
 * Uses the new /stable/ API endpoints (current as of 2025)
 * Documentation: https://site.financialmodelingprep.com/developer/docs
 */
export class FMPProvider {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl = 'https://financialmodelingprep.com/stable';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FMP_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('FMP API key not provided');
    } else {
      logger.info(`FMP API key loaded: ${this.apiKey.substring(0, 8)}...`);
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use((config) => {
      logger.debug(`FMP Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    });
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      logger.info(`FMP: Searching stocks with query: ${query}`);
      
      const response = await this.client.get('/search-symbol', {
        params: {
          query: query,
          limit: 20,
          apikey: this.apiKey,
        },
      });

      const results = response.data || [];
      
      return results.map((item: any) => ({
        ticker: item.symbol,
        name: item.name,
        exchange: item.exchange || 'N/A',
        type: item.type || 'stock',
      }));
    } catch (error: any) {
      logger.error('FMP search error:', error.message);
      throw new Error(`FMP search failed: ${error.message}`);
    }
  }

  async getStockProfile(ticker: string): Promise<StockProfile> {
    try {
      logger.info(`FMP: Fetching profile for ${ticker}`);
      
      const response = await this.client.get('/profile', {
        params: {
          symbol: ticker,
          apikey: this.apiKey,
        },
      });

      const data = response.data?.[0];
      if (!data) {
        throw new Error('No profile data found');
      }

      return {
        ticker: data.symbol,
        name: data.companyName,
        exchange: data.exchange || 'N/A',
        sector: data.sector || 'N/A',
        industry: data.industry || 'N/A',
        description: data.description || '',
        marketCap: data.marketCap || 0,
        sharesOutstanding: data.fullTimeEmployees || 0, // Note: FMP stable doesn't provide shares outstanding in profile
      };
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      logger.error(`FMP profile error for ${ticker}: Status ${statusCode}`, errorData || error.message);
      
      if (statusCode === 403) {
        throw new Error(`FMP API key invalid or rate limit exceeded (403)`);
      }
      throw new Error(`FMP profile fetch failed: ${error.message}`);
    }
  }

  async getStockPrice(ticker: string): Promise<StockPrice> {
    try {
      logger.info(`FMP: Fetching price for ${ticker}`);
      
      const response = await this.client.get('/quote', {
        params: {
          symbol: ticker,
          apikey: this.apiKey,
        },
      });

      const data = response.data?.[0];
      if (!data) {
        throw new Error('No price data found');
      }

      return {
        ticker: data.symbol,
        price: data.price,
        currency: 'USD',
        timestamp: new Date(data.timestamp * 1000 || Date.now()),
      };
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      logger.error(`FMP price error for ${ticker}: Status ${statusCode}`, errorData || error.message);
      
      if (statusCode === 403) {
        throw new Error(`FMP API key invalid or rate limit exceeded (403)`);
      }
      throw new Error(`FMP price fetch failed: ${error.message}`);
    }
  }

  async getFinancials(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatements> {
    try {
      logger.info(`FMP: Fetching ${period} financials for ${ticker}`);
      
      const periodParam = period === 'annual' ? 'annual' : 'quarter';
      
      // Fetch income statement, balance sheet, and cash flow in parallel
      const [incomeResponse, balanceResponse, cashFlowResponse] = await Promise.all([
        this.client.get('/income-statement', {
          params: {
            symbol: ticker,
            period: periodParam,
            limit: 10,
            apikey: this.apiKey,
          },
        }),
        this.client.get('/balance-sheet-statement', {
          params: {
            symbol: ticker,
            period: periodParam,
            limit: 10,
            apikey: this.apiKey,
          },
        }),
        this.client.get('/cash-flow-statement', {
          params: {
            symbol: ticker,
            period: periodParam,
            limit: 10,
            apikey: this.apiKey,
          },
        }),
      ]);

      const incomeStatements = incomeResponse.data || [];
      const balanceSheets = balanceResponse.data || [];
      const cashFlows = cashFlowResponse.data || [];

      // Merge data by date
      const dateMap = new Map<string, any>();

      incomeStatements.forEach((stmt: any) => {
        const date = stmt.date || stmt.calendarYear;
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).income = stmt;
      });

      balanceSheets.forEach((stmt: any) => {
        const date = stmt.date || stmt.calendarYear;
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).balance = stmt;
      });

      cashFlows.forEach((stmt: any) => {
        const date = stmt.date || stmt.calendarYear;
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).cashflow = stmt;
      });

      // Build financial statements
      const statements: FinancialStatement[] = [];

      for (const [date, data] of dateMap.entries()) {
        const income = data.income || {};
        const balance = data.balance || {};
        const cashflow = data.cashflow || {};

        // Calculate dividends per share
        const sharesOutstanding = income.weightedAverageShsOutDil || income.weightedAverageShsOut || 1;
        const dividendsPaid = Math.abs(cashflow.commonDividendsPaid || cashflow.dividendsPaid || 0);
        const dividendPerShare = sharesOutstanding > 0 ? dividendsPaid / sharesOutstanding : 0;

        statements.push({
          date: date,
          revenue: income.revenue || 0,
          netIncome: income.netIncome || 0,
          ebitda: income.ebitda || 0,
          eps: income.epsDiluted || income.eps || 0,
          totalAssets: balance.totalAssets || 0,
          totalLiabilities: balance.totalLiabilities || 0,
          bookValue: balance.totalStockholdersEquity || balance.totalEquity || 0,
          freeCashFlow: cashflow.freeCashFlow || 0,
          capex: Math.abs(cashflow.capitalExpenditure || 0),
          workingCapital: (balance.totalCurrentAssets || 0) - (balance.totalCurrentLiabilities || 0),
          dividendPerShare: dividendPerShare,
        });
      }

      return {
        ticker: ticker.toUpperCase(),
        period: period,
        statements: statements.sort((a, b) => b.date.localeCompare(a.date)),
      };
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      logger.error(`FMP financials error for ${ticker}: Status ${statusCode}`, errorData || error.message || error);
      throw new Error(`FMP financials fetch failed: ${error.message || 'Unknown error'}`);
    }
  }

  async getIndustryPeers(ticker: string): Promise<IndustryPeer[]> {
    try {
      logger.info(`FMP: Fetching industry peers for ${ticker}`);
      
      // Note: The /company-screener endpoint requires a paid FMP plan (402 error on free tier)
      // For now, return empty array to allow other valuation models to work
      logger.warn(`FMP: Industry peers endpoint requires paid plan, returning empty array`);
      
      return [];
    } catch (error: any) {
      logger.error(`FMP peers error for ${ticker}:`, error.message);
      // Don't throw error, just return empty array
      return [];
    }
  }
}
