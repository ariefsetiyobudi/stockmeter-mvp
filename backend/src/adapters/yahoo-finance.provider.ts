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

export class YahooFinanceProvider {
  private client: AxiosInstance;
  private baseUrl = 'https://query2.finance.yahoo.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      logger.info(`Yahoo Finance: Searching stocks with query: ${query}`);
      
      const response = await this.client.get('/v1/finance/search', {
        params: {
          q: query,
          quotesCount: 20,
          newsCount: 0,
        },
      });

      const quotes = response.data?.quotes || [];
      
      return quotes
        .filter((quote: any) => quote.symbol && quote.shortname)
        .map((quote: any) => ({
          ticker: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          exchange: quote.exchange || 'N/A',
          type: quote.quoteType || 'EQUITY',
        }))
        .slice(0, 20);
    } catch (error: any) {
      logger.error('Yahoo Finance search error:', error.message);
      throw new Error(`Yahoo Finance search failed: ${error.message}`);
    }
  }

  async getStockProfile(ticker: string): Promise<StockProfile> {
    try {
      logger.info(`Yahoo Finance: Fetching profile for ${ticker}`);
      
      const response = await this.client.get('/v10/finance/quoteSummary/' + ticker, {
        params: {
          modules: 'assetProfile,summaryProfile,price',
        },
      });

      const result = response.data?.quoteSummary?.result?.[0];
      if (!result) {
        throw new Error('No profile data found');
      }

      const profile = result.assetProfile || result.summaryProfile || {};
      const priceData = result.price || {};

      return {
        ticker: ticker.toUpperCase(),
        name: priceData.longName || priceData.shortName || ticker,
        exchange: priceData.exchangeName || 'N/A',
        sector: profile.sector || 'N/A',
        industry: profile.industry || 'N/A',
        description: profile.longBusinessSummary || '',
        marketCap: priceData.marketCap || 0,
        sharesOutstanding: priceData.sharesOutstanding || 0,
      };
    } catch (error: any) {
      logger.error(`Yahoo Finance profile error for ${ticker}:`, error.message);
      throw new Error(`Yahoo Finance profile fetch failed: ${error.message}`);
    }
  }

  async getStockPrice(ticker: string): Promise<StockPrice> {
    try {
      logger.info(`Yahoo Finance: Fetching price for ${ticker}`);
      
      const response = await this.client.get('/v8/finance/chart/' + ticker, {
        params: {
          interval: '1d',
          range: '1d',
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        throw new Error('No price data found');
      }

      const meta = result.meta;
      const price = meta.regularMarketPrice || meta.previousClose;

      if (!price) {
        throw new Error('Price not available');
      }

      return {
        ticker: ticker.toUpperCase(),
        price: price,
        currency: meta.currency || 'USD',
        timestamp: new Date(meta.regularMarketTime * 1000 || Date.now()),
      };
    } catch (error: any) {
      logger.error(`Yahoo Finance price error for ${ticker}:`, error.message);
      throw new Error(`Yahoo Finance price fetch failed: ${error.message}`);
    }
  }

  async getFinancials(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatements> {
    try {
      logger.info(`Yahoo Finance: Fetching ${period} financials for ${ticker}`);
      
      const modules = period === 'annual' 
        ? 'incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,defaultKeyStatistics'
        : 'incomeStatementHistoryQuarterly,balanceSheetHistoryQuarterly,cashflowStatementHistoryQuarterly,defaultKeyStatistics';

      const response = await this.client.get('/v10/finance/quoteSummary/' + ticker, {
        params: {
          modules: modules,
        },
      });

      const result = response.data?.quoteSummary?.result?.[0];
      if (!result) {
        throw new Error('No financial data found');
      }

      const incomeStatements = period === 'annual'
        ? result.incomeStatementHistory?.incomeStatementHistory || []
        : result.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];

      const balanceSheets = period === 'annual'
        ? result.balanceSheetHistory?.balanceSheetStatements || []
        : result.balanceSheetHistoryQuarterly?.balanceSheetStatements || [];

      const cashFlows = period === 'annual'
        ? result.cashflowStatementHistory?.cashflowStatements || []
        : result.cashflowStatementHistoryQuarterly?.cashflowStatements || [];

      const statements: FinancialStatement[] = [];

      // Merge data by date
      const dateMap = new Map<string, any>();

      incomeStatements.forEach((stmt: any) => {
        const date = stmt.endDate?.fmt || '';
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).income = stmt;
      });

      balanceSheets.forEach((stmt: any) => {
        const date = stmt.endDate?.fmt || '';
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).balance = stmt;
      });

      cashFlows.forEach((stmt: any) => {
        const date = stmt.endDate?.fmt || '';
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).cashflow = stmt;
      });

      // Build financial statements
      for (const [date, data] of dateMap.entries()) {
        const income = data.income || {};
        const balance = data.balance || {};
        const cashflow = data.cashflow || {};

        statements.push({
          date: date,
          revenue: income.totalRevenue?.raw || 0,
          netIncome: income.netIncome?.raw || 0,
          ebitda: income.ebitda?.raw || 0,
          eps: income.basicEPS?.raw || 0,
          totalAssets: balance.totalAssets?.raw || 0,
          totalLiabilities: balance.totalLiab?.raw || 0,
          bookValue: balance.totalStockholderEquity?.raw || 0,
          freeCashFlow: cashflow.freeCashFlow?.raw || 0,
          capex: cashflow.capitalExpenditures?.raw || 0,
          workingCapital: balance.totalCurrentAssets?.raw - balance.totalCurrentLiabilities?.raw || 0,
          dividendPerShare: income.dividendPerShare?.raw || 0,
        });
      }

      return {
        ticker: ticker.toUpperCase(),
        period: period,
        statements: statements.sort((a, b) => b.date.localeCompare(a.date)),
      };
    } catch (error: any) {
      logger.error(`Yahoo Finance financials error for ${ticker}:`, error.message);
      throw new Error(`Yahoo Finance financials fetch failed: ${error.message}`);
    }
  }

  async getIndustryPeers(ticker: string): Promise<IndustryPeer[]> {
    try {
      logger.info(`Yahoo Finance: Fetching industry peers for ${ticker}`);
      
      // First get the stock's sector and industry
      const profile = await this.getStockProfile(ticker);
      
      // Yahoo Finance doesn't have a direct peers endpoint, so we'll search by industry
      // This is a simplified implementation - in production, you might want to use a different approach
      const searchQuery = profile.industry.split(' ')[0]; // Use first word of industry
      const searchResults = await this.searchStocks(searchQuery);
      
      // Filter to get stocks in same industry and fetch their data
      const peers: IndustryPeer[] = [];
      
      for (const result of searchResults.slice(0, 15)) {
        if (result.ticker === ticker) continue;
        
        try {
          const peerProfile = await this.getStockProfile(result.ticker);
          
          if (peerProfile.industry === profile.industry || peerProfile.sector === profile.sector) {
            // Get valuation ratios
            const response = await this.client.get('/v10/finance/quoteSummary/' + result.ticker, {
              params: {
                modules: 'defaultKeyStatistics,summaryDetail',
              },
            });

            const data = response.data?.quoteSummary?.result?.[0];
            const stats = data?.defaultKeyStatistics || {};
            const summary = data?.summaryDetail || {};

            const peValue = stats.trailingPE?.raw || summary.trailingPE?.raw || 0;
            const pbValue = stats.priceToBook?.raw || 0;
            const psValue = stats.priceToSalesTrailing12Months?.raw || 0;
            
            peers.push({
              ticker: result.ticker,
              name: peerProfile.name,
              sector: peerProfile.sector,
              industry: peerProfile.industry,
              marketCap: peerProfile.marketCap,
              pe: peValue,
              pb: pbValue,
              ps: psValue,
              peRatio: peValue || null,
              pbRatio: pbValue || null,
              psRatio: psValue || null,
            });

            if (peers.length >= 10) break;
          }
        } catch (error) {
          // Skip peers that fail to fetch
          logger.warn(`Failed to fetch peer data for ${result.ticker}`);
          continue;
        }
      }

      return peers;
    } catch (error: any) {
      logger.error(`Yahoo Finance peers error for ${ticker}:`, error.message);
      throw new Error(`Yahoo Finance peers fetch failed: ${error.message}`);
    }
  }
}
