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

export class TwelveDataProvider {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl = 'https://api.twelvedata.com';

  constructor() {
    this.apiKey = process.env['TWELVE_DATA_API_KEY'] || '';
    
    if (!this.apiKey) {
      logger.warn('Twelve Data API key not configured');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      params: {
        apikey: this.apiKey,
      },
    });
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      logger.info(`Twelve Data: Searching stocks with query: ${query}`);
      
      const response = await this.client.get('/symbol_search', {
        params: {
          symbol: query,
          outputsize: 20,
        },
      });

      if (response.data?.status === 'error') {
        throw new Error(response.data.message || 'Twelve Data API error');
      }

      const data = response.data?.data || [];
      
      return data.map((item: any) => ({
        ticker: item.symbol,
        name: item.instrument_name || item.symbol,
        exchange: item.exchange || 'N/A',
        type: item.instrument_type || 'Common Stock',
      }));
    } catch (error: any) {
      logger.error('Twelve Data search error:', error.message);
      throw new Error(`Twelve Data search failed: ${error.message}`);
    }
  }

  async getStockProfile(ticker: string): Promise<StockProfile> {
    try {
      logger.info(`Twelve Data: Fetching profile for ${ticker}`);
      
      // Twelve Data uses /profile endpoint
      const response = await this.client.get('/profile', {
        params: {
          symbol: ticker,
        },
      });

      if (response.data?.status === 'error') {
        throw new Error(response.data.message || 'Twelve Data API error');
      }

      const data = response.data;
      
      return {
        ticker: ticker.toUpperCase(),
        name: data.name || ticker,
        exchange: data.exchange || 'N/A',
        sector: data.sector || 'N/A',
        industry: data.industry || 'N/A',
        description: data.description || '',
        marketCap: data.market_cap || 0,
        sharesOutstanding: data.shares_outstanding || 0,
      };
    } catch (error: any) {
      logger.error(`Twelve Data profile error for ${ticker}:`, error.message);
      throw new Error(`Twelve Data profile fetch failed: ${error.message}`);
    }
  }

  async getStockPrice(ticker: string): Promise<StockPrice> {
    try {
      logger.info(`Twelve Data: Fetching price for ${ticker}`);
      
      // Use /quote endpoint for real-time price
      const response = await this.client.get('/quote', {
        params: {
          symbol: ticker,
        },
      });

      if (response.data?.status === 'error') {
        throw new Error(response.data.message || 'Twelve Data API error');
      }

      const data = response.data;
      
      return {
        ticker: ticker.toUpperCase(),
        price: parseFloat(data.close) || 0,
        currency: 'USD',
        timestamp: new Date(data.datetime || Date.now()),
      };
    } catch (error: any) {
      logger.error(`Twelve Data price error for ${ticker}:`, error.message);
      throw new Error(`Twelve Data price fetch failed: ${error.message}`);
    }
  }

  async getFinancials(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatements> {
    try {
      logger.info(`Twelve Data: Fetching ${period} financials for ${ticker}`);
      
      // Twelve Data uses separate endpoints for income statement, balance sheet, and cash flow
      const [incomeResponse, balanceResponse, cashFlowResponse] = await Promise.all([
        this.client.get('/income_statement', {
          params: {
            symbol: ticker,
            period: period === 'annual' ? 'annual' : 'quarterly',
          },
        }),
        this.client.get('/balance_sheet', {
          params: {
            symbol: ticker,
            period: period === 'annual' ? 'annual' : 'quarterly',
          },
        }),
        this.client.get('/cash_flow', {
          params: {
            symbol: ticker,
            period: period === 'annual' ? 'annual' : 'quarterly',
          },
        }),
      ]);

      if (incomeResponse.data?.status === 'error') {
        throw new Error(incomeResponse.data.message || 'Twelve Data API error');
      }

      const incomeStatements = incomeResponse.data?.income_statement || [];
      const balanceSheets = balanceResponse.data?.balance_sheet || [];
      const cashFlows = cashFlowResponse.data?.cash_flow || [];

      // Combine data by fiscal date
      const statements: FinancialStatement[] = incomeStatements.map((income: any, index: number) => {
        const balance = balanceSheets[index] || {};
        const cashFlow = cashFlows[index] || {};

        return {
          date: income.fiscal_date || '',
          revenue: parseFloat(income.revenues) || 0,
          netIncome: parseFloat(income.net_income) || 0,
          ebitda: parseFloat(income.ebitda) || 0,
          eps: parseFloat(income.earnings_per_share) || 0,
          totalAssets: parseFloat(balance.total_assets) || 0,
          totalLiabilities: parseFloat(balance.total_liabilities) || 0,
          bookValue: parseFloat(balance.total_equity) || 0,
          freeCashFlow: parseFloat(cashFlow.free_cash_flow) || 0,
          capex: parseFloat(cashFlow.capital_expenditures) || 0,
          workingCapital: parseFloat(balance.current_assets) - parseFloat(balance.current_liabilities) || 0,
          dividendPerShare: parseFloat(income.dividend_per_share) || 0,
        };
      });

      return {
        ticker: ticker.toUpperCase(),
        period,
        statements,
      };
    } catch (error: any) {
      logger.error(`Twelve Data financials error for ${ticker}:`, error.message);
      throw new Error(`Twelve Data financials fetch failed: ${error.message}`);
    }
  }

  async getIndustryPeers(ticker: string): Promise<IndustryPeer[]> {
    try {
      logger.info(`Twelve Data: Fetching industry peers for ${ticker}`);
      
      // First get the profile to know the sector/industry
      const profile = await this.getStockProfile(ticker);
      
      // Twelve Data doesn't have a direct peers endpoint
      // We'll return an empty array and let the failover handle it
      logger.warn(`Twelve Data: Industry peers not directly supported, using failover`);
      
      return [];
    } catch (error: any) {
      logger.error(`Twelve Data peers error for ${ticker}:`, error.message);
      throw new Error(`Twelve Data peers fetch failed: ${error.message}`);
    }
  }
}
