/**
 * API Integration Test Utility
 * Tests all frontend-backend API connections
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export class APITester {
  private baseURL: string;
  private accessToken: string | null = null;
  private results: TestResult[] = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async test(name: string, testFn: () => Promise<void>): Promise<void> {
    try {
      await testFn();
      this.results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error: any) {
      this.results.push({
        name,
        passed: false,
        error: error.message || String(error),
      });
      console.error(`❌ ${name}:`, error.message || error);
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting API Integration Tests...\n');

    // Health check
    await this.test('Health Check', async () => {
      const response = await fetch(`${this.baseURL}/health`);
      if (!response.ok) throw new Error('Health check failed');
    });

    // Authentication tests
    await this.testAuthentication();

    // Stock data tests
    await this.testStockData();

    // Watchlist tests (requires auth)
    if (this.accessToken) {
      await this.testWatchlist();
    }

    // Alert tests (requires Pro)
    if (this.accessToken) {
      await this.testAlerts();
    }

    // Payment tests
    await this.testPayment();

    // Export tests (requires Pro)
    if (this.accessToken) {
      await this.testExport();
    }

    // Currency tests
    await this.testCurrency();

    console.log('\n📊 Test Summary:');
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    console.log(`Passed: ${passed}/${this.results.length}`);
    console.log(`Failed: ${failed}/${this.results.length}`);

    return this.results;
  }

  private async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');

    // Test registration endpoint exists
    await this.test('POST /api/auth/register endpoint', async () => {
      // Just check endpoint exists (will fail with validation error, which is expected)
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      // Expect 400 (validation error) not 404
      if (response.status === 404) throw new Error('Endpoint not found');
    });

    // Test login endpoint exists
    await this.test('POST /api/auth/login endpoint', async () => {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.status === 404) throw new Error('Endpoint not found');
    });

    // Test OAuth endpoints exist
    await this.test('GET /api/auth/google endpoint', async () => {
      const response = await fetch(`${this.baseURL}/api/auth/google`, {
        redirect: 'manual',
      });
      // Should redirect (302) or return something other than 404
      if (response.status === 404) throw new Error('Endpoint not found');
    });
  }

  private async testStockData() {
    console.log('\n📈 Testing Stock Data...');

    // Test stock search
    await this.test('GET /api/stocks/search', async () => {
      const response = await fetch(
        `${this.baseURL}/api/stocks/search?q=AAPL`
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Expected array response');
    });

    // Test stock profile
    await this.test('GET /api/stocks/:ticker', async () => {
      const response = await fetch(`${this.baseURL}/api/stocks/AAPL`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      if (!data.ticker) throw new Error('Missing ticker in response');
    });

    // Test fair value calculation
    await this.test('GET /api/stocks/:ticker/fairvalue', async () => {
      const response = await fetch(
        `${this.baseURL}/api/stocks/AAPL/fairvalue`
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      if (!data.currentPrice) throw new Error('Missing currentPrice');
      if (!data.dcf) throw new Error('Missing DCF calculation');
    });

    // Test batch comparison
    await this.test('POST /api/stocks/compare', async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(`${this.baseURL}/api/stocks/compare`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tickers: ['AAPL'] }),
      });
      // May require Pro, but endpoint should exist
      if (response.status === 404) throw new Error('Endpoint not found');
    });
  }

  private async testWatchlist() {
    console.log('\n⭐ Testing Watchlist...');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };

    // Test get watchlist
    await this.test('GET /api/user/watchlist', async () => {
      const response = await fetch(`${this.baseURL}/api/user/watchlist`, {
        headers,
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      if (!data.watchlist) throw new Error('Missing watchlist in response');
    });

    // Test add to watchlist endpoint exists
    await this.test('POST /api/user/watchlist endpoint', async () => {
      const response = await fetch(`${this.baseURL}/api/user/watchlist`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticker: 'TEST' }),
      });
      // May fail with validation, but endpoint should exist
      if (response.status === 404) throw new Error('Endpoint not found');
    });

    // Test remove from watchlist endpoint exists
    await this.test('DELETE /api/user/watchlist/:ticker endpoint', async () => {
      const response = await fetch(
        `${this.baseURL}/api/user/watchlist/TEST`,
        {
          method: 'DELETE',
          headers,
        }
      );
      // May fail if ticker doesn't exist, but endpoint should exist
      if (response.status === 404) throw new Error('Endpoint not found');
    });
  }

  private async testAlerts() {
    console.log('\n🔔 Testing Alerts...');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };

    // Test get alerts
    await this.test('GET /api/alerts', async () => {
      const response = await fetch(`${this.baseURL}/api/alerts`, { headers });
      // May require Pro, but endpoint should exist
      if (response.status === 404) throw new Error('Endpoint not found');
    });

    // Test create alert endpoint exists
    await this.test('POST /api/alerts endpoint', async () => {
      const response = await fetch(`${this.baseURL}/api/alerts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      // May require Pro or fail validation, but endpoint should exist
      if (response.status === 404) throw new Error('Endpoint not found');
    });
  }

  private async testPayment() {
    console.log('\n💳 Testing Payment...');

    // Test subscription endpoint exists
    await this.test('POST /api/payments/subscribe endpoint', async () => {
      const response = await fetch(`${this.baseURL}/api/payments/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      // May fail with validation, but endpoint should exist
      if (response.status === 404) throw new Error('Endpoint not found');
    });

    // Test subscription status endpoint
    if (this.accessToken) {
      await this.test('GET /api/user/subscription', async () => {
        const response = await fetch(`${this.baseURL}/api/user/subscription`, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        if (response.status === 404) throw new Error('Endpoint not found');
      });
    }
  }

  private async testExport() {
    console.log('\n📥 Testing Export...');

    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
    };

    // Test export endpoint exists
    await this.test('GET /api/download endpoint', async () => {
      const response = await fetch(
        `${this.baseURL}/api/download?format=csv&tickers=AAPL`,
        { headers }
      );
      // May require Pro, but endpoint should exist
      if (response.status === 404) throw new Error('Endpoint not found');
    });
  }

  private async testCurrency() {
    console.log('\n💱 Testing Currency...');

    // Test exchange rates endpoint
    await this.test('GET /api/currency/rates', async () => {
      const response = await fetch(`${this.baseURL}/api/currency/rates`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      if (!data.rates) throw new Error('Missing rates in response');
    });
  }
}

// Export test runner for use in browser console or test scripts
export async function runAPITests(baseURL: string = 'http://localhost:3001') {
  const tester = new APITester(baseURL);
  return await tester.runAllTests();
}
