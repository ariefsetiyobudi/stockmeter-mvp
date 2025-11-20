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

export class FMPProvider {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl = 'https://financialmodelingprep.com/api/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FMP_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('FMP API key not provided');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      logger.info(`FMP: Searching stocks with query: ${query}`);
      
      const response = await this.client.get('/search', {
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
        exchange: item.exchangeShortName || item.stockExchange || 'N/A',
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
      
      const response = await this.client.get(`/profile/${ticker}`, {
        params: {
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
        exchange: data.exchangeShortName || data.exchange || 'N/A',
        sector: data.sector || 'N/A',
        industry: data.industry || 'N/A',
        description: data.description || '',
        marketCap: data.mktCap || 0,
        sharesOutstanding: data.volAvg || 0, // FMP doesn't provide shares outstanding directly
      };
    } catch (error: any) {
      logger.error(`FMP profile error for ${ticker}:`, error.message);
      throw new Error(`FMP profile fetch failed: ${error.message}`);
    }
  }

  async getStockPrice(ticker: string): Promise<StockPrice> {
    try {
      logger.info(`FMP: Fetching price for ${ticker}`);
      
      const response = await this.client.get(`/quote/${ticker}`, {
        params: {
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
        currency: 'USD', // FMP primarily uses USD
        timestamp: new Date(data.timestamp * 1000 || Date.now()),
      };
    } catch (error: any) {
      logger.error(`FMP price error for ${ticker}:`, error.message);
      throw new Error(`FMP price fetch failed: ${error.message}`);
    }
  }

  async getFinancials(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatements> {
    try {
      logger.info(`FMP: Fetching ${period} financials for ${ticker}`);
      
      const periodParam = period === 'annual' ? 'annual' : 'quarter';
      
      // Fetch income statement
      const incomeResponse = await this.client.get(`/income-statement/${ticker}`, {
        params: {
          period: periodParam,
          limit: 10,
          apikey: this.apiKey,
        },
      });

      // Fetch balance sheet
      const balanceResponse = await this.client.get(`/balance-sheet-statement/${ticker}`, {
        params: {
          period: periodParam,
          limit: 10,
          apikey: this.apiKey,
        },
      });

      // Fetch cash flow
      const cashFlowResponse = await this.client.get(`/cash-flow-statement/${ticker}`, {
        params: {
          period: periodParam,
          limit: 10,
          apikey: this.apiKey,
        },
      });

      const incomeStatements = incomeResponse.data || [];
      const balanceSheets = balanceResponse.data || [];
      const cashFlows = cashFlowResponse.data || [];

      // Merge data by date
      const dateMap = new Map<string, any>();

      incomeStatements.forEach((stmt: any) => {
        const date = stmt.date;
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).income = stmt;
      });

      balanceSheets.forEach((stmt: any) => {
        const date = stmt.date;
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).balance = stmt;
      });

      cashFlows.forEach((stmt: any) => {
        const date = stmt.date;
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

        statements.push({
          date: date,
          revenue: income.revenue || 0,
          netIncome: income.netIncome || 0,
          ebitda: income.ebitda || 0,
          eps: income.eps || 0,
          totalAssets: balance.totalAssets || 0,
          totalLiabilities: balance.totalLiabilities || 0,
          bookValue: balance.totalStockholdersEquity || 0,
          freeCashFlow: cashflow.freeCashFlow || 0,
          capex: cashflow.capitalExpenditure || 0,
          workingCapital: balance.totalCurrentAssets - balance.totalCurrentLiabilities || 0,
          dividendPerShare: income.dividendPerShare || 0,
        });
      }

      return {
        ticker: ticker.toUpperCase(),
        period: period,
        statements: statements.sort((a, b) => b.date.localeCompare(a.date)),
      };
    } catch (error: any) {
      logger.error(`FMP financials error for ${ticker}:`, error.message);
      throw new Error(`FMP financials fetch failed: ${error.message}`);
    }
  }

  async getIndustryPeers(ticker: string): Promise<IndustryPeer[]> {
    try {
      logger.info(`FMP: Fetching industry peers for ${ticker}`);
      
      // Get stock profile to determine sector/industry
      const profile = await this.getStockProfile(ticker);
      
      // FMP has a stock screener endpoint we can use
      const response = await this.client.get('/stock-screener', {
        params: {
          sector: profile.sector,
          limit: 50,
          apikey: this.apiKey,
        },
      });

      const stocks = response.data || [];
      
      // Filter and get detailed data for peers
      const peers: IndustryPeer[] = [];
      
      for (const stock of stocks) {
        if (stock.symbol === ticker) continue;
        
        try {
          // Get ratios for the peer
          const ratiosResponse = await this.client.get(`/ratios/${stock.symbol}`, {
            params: {
              limit: 1,
              apikey: this.apiKey,
            },
          });

          const ratios = ratiosResponse.data?.[0] || {};

          const peValue = ratios.priceEarningsRatio || 0;
          const pbValue = ratios.priceToBookRatio || 0;
          const psValue = ratios.priceToSalesRatio || 0;
          
          peers.push({
            ticker: stock.symbol,
            name: stock.companyName,
            sector: stock.sector || profile.sector,
            industry: stock.industry || profile.industry,
            marketCap: stock.marketCap || 0,
            pe: peValue,
            pb: pbValue,
            ps: psValue,
            peRatio: peValue || null,
            pbRatio: pbValue || null,
            psRatio: psValue || null,
          });

          if (peers.length >= 10) break;
        } catch (error) {
          // Skip peers that fail to fetch
          logger.warn(`Failed to fetch peer data for ${stock.symbol}`);
          continue;
        }
      }

      return peers;
    } catch (error: any) {
      logger.error(`FMP peers error for ${ticker}:`, error.message);
      throw new Error(`FMP peers fetch failed: ${error.message}`);
    }
  }
}
