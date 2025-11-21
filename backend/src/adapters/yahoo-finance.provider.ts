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

interface YahooCrumbData {
  crumb: string;
  cookie: string;
  expiresAt: number;
}

export class YahooFinanceProvider {
  private client: AxiosInstance;
  private baseUrl = 'https://query2.finance.yahoo.com';
  private crumbData: YahooCrumbData | null = null;
  private crumbRefreshInProgress: Promise<void> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
  }

  /**
   * Get or refresh the crumb and cookie for Yahoo Finance authentication
   */
  private async getCrumb(): Promise<YahooCrumbData> {
    // If crumb is valid and not expired, return it
    if (this.crumbData && this.crumbData.expiresAt > Date.now()) {
      return this.crumbData;
    }

    // If refresh is already in progress, wait for it
    if (this.crumbRefreshInProgress) {
      await this.crumbRefreshInProgress;
      if (this.crumbData) {
        return this.crumbData;
      }
    }

    // Start refresh process
    this.crumbRefreshInProgress = this.refreshCrumb();
    await this.crumbRefreshInProgress;
    this.crumbRefreshInProgress = null;

    if (!this.crumbData) {
      throw new Error('Failed to obtain Yahoo Finance crumb');
    }

    return this.crumbData;
  }

  /**
   * Refresh the crumb and cookie from Yahoo Finance
   */
  private async refreshCrumb(): Promise<void> {
    try {
      logger.info('Yahoo Finance: Refreshing crumb and cookie');

      // Step 1: Get cookie from Yahoo Finance homepage with full browser headers
      const homeResponse = await axios.get('https://finance.yahoo.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        maxRedirects: 5,
        validateStatus: () => true, // Accept any status code
      });

      logger.debug(`Yahoo Finance: Homepage response status: ${homeResponse.status}`);

      // Extract cookies from response
      const cookies = homeResponse.headers['set-cookie'];
      if (!cookies || cookies.length === 0) {
        logger.warn('Yahoo Finance: No cookies in response headers, trying alternative approach');
        
        // Alternative: Try to get crumb without cookie (some endpoints might work)
        try {
          const directCrumbResponse = await axios.get('https://query2.finance.yahoo.com/v1/test/getcrumb', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            validateStatus: () => true,
          });
          
          if (directCrumbResponse.status === 200 && directCrumbResponse.data) {
            logger.info('Yahoo Finance: Got crumb without cookie');
            this.crumbData = {
              crumb: directCrumbResponse.data,
              cookie: '',
              expiresAt: Date.now() + 3600000,
            };
            return;
          }
        } catch (e) {
          logger.debug('Yahoo Finance: Direct crumb request also failed');
        }
        
        throw new Error('No cookies received from Yahoo Finance and direct crumb request failed');
      }

      // Combine all cookies into a single cookie string
      const cookieString = cookies
        .map(cookie => cookie.split(';')[0])
        .join('; ');

      logger.info(`Yahoo Finance: Obtained ${cookies.length} cookies`);

      // Step 2: Get crumb using the cookie
      const crumbResponse = await axios.get('https://query2.finance.yahoo.com/v1/test/getcrumb', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': cookieString,
          'Accept': '*/*',
        },
        validateStatus: () => true, // Accept any status code
      });

      logger.debug(`Yahoo Finance: Crumb response status: ${crumbResponse.status}`);

      if (crumbResponse.status !== 200) {
        logger.error(`Yahoo Finance: Crumb request failed with status ${crumbResponse.status}`, crumbResponse.data);
        throw new Error(`Crumb request failed with status ${crumbResponse.status}`);
      }

      const crumb = crumbResponse.data;
      if (!crumb || typeof crumb !== 'string' || crumb.length === 0) {
        logger.error('Yahoo Finance: Invalid crumb received:', crumb);
        throw new Error('Invalid crumb received from Yahoo Finance');
      }

      logger.info(`Yahoo Finance: Successfully obtained crumb: ${crumb.substring(0, 10)}...`);

      // Store crumb data with 1 hour expiration
      this.crumbData = {
        crumb,
        cookie: cookieString,
        expiresAt: Date.now() + 3600000, // 1 hour
      };
    } catch (error: any) {
      logger.error('Yahoo Finance: Failed to refresh crumb:', error.message, error.response?.data || '');
      this.crumbData = null;
      throw error;
    }
  }

  /**
   * Make an authenticated request to Yahoo Finance API
   */
  private async makeAuthenticatedRequest(url: string, params: any = {}): Promise<any> {
    const crumbData = await this.getCrumb();

    const response = await this.client.get(url, {
      params: {
        ...params,
        crumb: crumbData.crumb,
      },
      headers: {
        'Cookie': crumbData.cookie,
      },
    });

    return response;
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      logger.info(`Yahoo Finance: Searching stocks with query: ${query}`);
      
      const response = await this.makeAuthenticatedRequest('/v1/finance/search', {
        q: query,
        quotesCount: 20,
        newsCount: 0,
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
      
      const response = await this.makeAuthenticatedRequest('/v10/finance/quoteSummary/' + ticker, {
        modules: 'assetProfile,summaryProfile,price',
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
      
      const response = await this.makeAuthenticatedRequest('/v8/finance/chart/' + ticker, {
        interval: '1d',
        range: '1d',
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

      const response = await this.makeAuthenticatedRequest('/v10/finance/quoteSummary/' + ticker, {
        modules: modules,
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
            const response = await this.makeAuthenticatedRequest('/v10/finance/quoteSummary/' + result.ticker, {
              modules: 'defaultKeyStatistics,summaryDetail',
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
