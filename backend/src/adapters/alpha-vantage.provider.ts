import axios, { AxiosInstance } from 'axios';
import {
  IFinancialDataProvider,
  StockSearchResult,
  StockProfile,
  StockPrice,
  FinancialStatements,
  FinancialStatement,
  IndustryPeer,
} from '../types';
import { logger } from '../utils/logger';

export class AlphaVantageProvider implements IFinancialDataProvider {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('Alpha Vantage API key not provided');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      logger.info(`Alpha Vantage: Searching stocks with query: ${query}`);
      
      const response = await this.client.get('', {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: query,
          apikey: this.apiKey,
        },
      });

      const matches = response.data?.bestMatches || [];
      
      return matches.map((match: any) => ({
        ticker: match['1. symbol'],
        name: match['2. name'],
        exchange: match['4. region'] || 'N/A',
        type: match['3. type'] || 'Equity',
      })).slice(0, 20);
    } catch (error: any) {
      logger.error('Alpha Vantage search error:', error.message);
      throw new Error(`Alpha Vantage search failed: ${error.message}`);
    }
  }

  async getStockProfile(ticker: string): Promise<StockProfile> {
    try {
      logger.info(`Alpha Vantage: Fetching profile for ${ticker}`);
      
      const response = await this.client.get('', {
        params: {
          function: 'OVERVIEW',
          symbol: ticker,
          apikey: this.apiKey,
        },
      });

      const data = response.data;
      
      if (!data || !data.Symbol) {
        throw new Error('No profile data found');
      }

      return {
        ticker: data.Symbol,
        name: data.Name || ticker,
        exchange: data.Exchange || 'N/A',
        sector: data.Sector || 'N/A',
        industry: data.Industry || 'N/A',
        description: data.Description || '',
        marketCap: parseFloat(data.MarketCapitalization) || 0,
        sharesOutstanding: parseFloat(data.SharesOutstanding) || 0,
      };
    } catch (error: any) {
      logger.error(`Alpha Vantage profile error for ${ticker}:`, error.message);
      throw new Error(`Alpha Vantage profile fetch failed: ${error.message}`);
    }
  }

  async getStockPrice(ticker: string): Promise<StockPrice> {
    try {
      logger.info(`Alpha Vantage: Fetching price for ${ticker}`);
      
      const response = await this.client.get('', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: ticker,
          apikey: this.apiKey,
        },
      });

      const quote = response.data?.['Global Quote'];
      
      if (!quote || !quote['05. price']) {
        throw new Error('No price data found');
      }

      return {
        ticker: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        currency: 'USD', // Alpha Vantage primarily uses USD
        timestamp: new Date(quote['07. latest trading day'] || Date.now()),
      };
    } catch (error: any) {
      logger.error(`Alpha Vantage price error for ${ticker}:`, error.message);
      throw new Error(`Alpha Vantage price fetch failed: ${error.message}`);
    }
  }

  async getFinancials(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatements> {
    try {
      logger.info(`Alpha Vantage: Fetching ${period} financials for ${ticker}`);
      
      // Fetch income statement
      const incomeResponse = await this.client.get('', {
        params: {
          function: 'INCOME_STATEMENT',
          symbol: ticker,
          apikey: this.apiKey,
        },
      });

      // Fetch balance sheet
      const balanceResponse = await this.client.get('', {
        params: {
          function: 'BALANCE_SHEET',
          symbol: ticker,
          apikey: this.apiKey,
        },
      });

      // Fetch cash flow
      const cashFlowResponse = await this.client.get('', {
        params: {
          function: 'CASH_FLOW',
          symbol: ticker,
          apikey: this.apiKey,
        },
      });

      const incomeStatements = period === 'annual'
        ? incomeResponse.data?.annualReports || []
        : incomeResponse.data?.quarterlyReports || [];

      const balanceSheets = period === 'annual'
        ? balanceResponse.data?.annualReports || []
        : balanceResponse.data?.quarterlyReports || [];

      const cashFlows = period === 'annual'
        ? cashFlowResponse.data?.annualReports || []
        : cashFlowResponse.data?.quarterlyReports || [];

      // Merge data by date
      const dateMap = new Map<string, any>();

      incomeStatements.forEach((stmt: any) => {
        const date = stmt.fiscalDateEnding;
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).income = stmt;
      });

      balanceSheets.forEach((stmt: any) => {
        const date = stmt.fiscalDateEnding;
        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }
        dateMap.get(date).balance = stmt;
      });

      cashFlows.forEach((stmt: any) => {
        const date = stmt.fiscalDateEnding;
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

        // Get shares outstanding for EPS calculation
        const sharesOutstanding = parseFloat(balance.commonStockSharesOutstanding) || 1;
        const netIncome = parseFloat(income.netIncome) || 0;
        const eps = netIncome / sharesOutstanding;

        statements.push({
          date: date,
          revenue: parseFloat(income.totalRevenue) || 0,
          netIncome: netIncome,
          ebitda: parseFloat(income.ebitda) || 0,
          eps: eps,
          totalAssets: parseFloat(balance.totalAssets) || 0,
          totalLiabilities: parseFloat(balance.totalLiabilities) || 0,
          bookValue: parseFloat(balance.totalShareholderEquity) || 0,
          freeCashFlow: parseFloat(cashflow.operatingCashflow) - Math.abs(parseFloat(cashflow.capitalExpenditures) || 0),
          capex: parseFloat(cashflow.capitalExpenditures) || 0,
          workingCapital: parseFloat(balance.totalCurrentAssets) - parseFloat(balance.totalCurrentLiabilities) || 0,
          dividendPerShare: parseFloat(cashflow.dividendPayout) / sharesOutstanding || 0,
        });
      }

      return {
        ticker: ticker.toUpperCase(),
        period: period,
        statements: statements.sort((a, b) => b.date.localeCompare(a.date)),
      };
    } catch (error: any) {
      logger.error(`Alpha Vantage financials error for ${ticker}:`, error.message);
      throw new Error(`Alpha Vantage financials fetch failed: ${error.message}`);
    }
  }

  async getIndustryPeers(ticker: string): Promise<IndustryPeer[]> {
    try {
      logger.info(`Alpha Vantage: Fetching industry peers for ${ticker}`);
      
      // Get stock profile to determine sector/industry
      const profile = await this.getStockProfile(ticker);
      
      // Alpha Vantage doesn't have a direct peers/screener endpoint
      // We'll need to use a workaround - search for companies in the same sector
      // This is a simplified implementation
      const searchQuery = profile.sector.split(' ')[0];
      const searchResults = await this.searchStocks(searchQuery);
      
      const peers: IndustryPeer[] = [];
      
      for (const result of searchResults) {
        if (result.ticker === ticker) continue;
        
        try {
          const peerProfile = await this.getStockProfile(result.ticker);
          
          // Check if same industry or sector
          if (peerProfile.industry === profile.industry || peerProfile.sector === profile.sector) {
            // Get overview for ratios
            const overviewResponse = await this.client.get('', {
              params: {
                function: 'OVERVIEW',
                symbol: result.ticker,
                apikey: this.apiKey,
              },
            });

            const overview = overviewResponse.data;

            peers.push({
              ticker: result.ticker,
              name: peerProfile.name,
              sector: peerProfile.sector,
              industry: peerProfile.industry,
              marketCap: peerProfile.marketCap,
              peRatio: parseFloat(overview.PERatio) || null,
              pbRatio: parseFloat(overview.PriceToBookRatio) || null,
              psRatio: parseFloat(overview.PriceToSalesRatioTTM) || null,
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
      logger.error(`Alpha Vantage peers error for ${ticker}:`, error.message);
      throw new Error(`Alpha Vantage peers fetch failed: ${error.message}`);
    }
  }
}
