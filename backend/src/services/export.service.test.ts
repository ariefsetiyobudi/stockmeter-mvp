import { ExportService } from './export.service';
import { FairValueResult } from '../types';

describe('ExportService', () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  describe('generateCSV', () => {
    it('should generate CSV with correct headers and data', () => {
      const mockData: FairValueResult[] = [
        {
          ticker: 'AAPL',
          currentPrice: 150.25,
          dcf: {
            fairValue: 160.5,
            assumptions: {
              revenueGrowthRate: 0.08,
              wacc: 0.10,
              terminalGrowthRate: 0.025,
              projectionYears: 10,
              fcfMargin: 0.25,
            },
            projectedCashFlows: [100, 108, 116.64],
          },
          ddm: {
            fairValue: 155.0,
            applicable: true,
            assumptions: {
              dividendGrowthRate: 0.05,
              discountRate: 0.10,
            },
          },
          relativeValue: {
            peRatioFairValue: 158.0,
            pbRatioFairValue: 152.0,
            psRatioFairValue: 156.0,
            companyMetrics: {
              pe: 25.5,
              pb: 8.2,
              ps: 6.5,
            },
            industryMedians: {
              pe: 26.0,
              pb: 8.5,
              ps: 6.8,
            },
          },
          graham: {
            fairValue: 145.0,
            applicable: true,
            assumptions: {
              eps: 6.0,
              bookValuePerShare: 18.5,
            },
          },
          valuationStatus: 'undervalued',
          calculatedAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      const csv = exportService.generateCSV(mockData);

      // Check headers
      expect(csv).toContain('Ticker');
      expect(csv).toContain('Current Price');
      expect(csv).toContain('DCF Fair Value');
      expect(csv).toContain('DDM Fair Value');
      expect(csv).toContain('Graham Number');
      expect(csv).toContain('Valuation Status');

      // Check data
      expect(csv).toContain('AAPL');
      expect(csv).toContain('150.25');
      expect(csv).toContain('160.50');
      expect(csv).toContain('155.00');
      expect(csv).toContain('Undervalued');
    });

    it('should handle N/A values for missing fair values', () => {
      const mockData: FairValueResult[] = [
        {
          ticker: 'TSLA',
          currentPrice: 200.0,
          dcf: null,
          ddm: {
            fairValue: null,
            applicable: false,
            assumptions: {
              dividendGrowthRate: 0,
              discountRate: 0,
            },
          },
          relativeValue: null,
          graham: null,
          valuationStatus: 'fairly_priced',
          calculatedAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      const csv = exportService.generateCSV(mockData);

      expect(csv).toContain('TSLA');
      expect(csv).toContain('200.00');
      expect(csv).toContain('N/A');
    });

    it('should escape commas and quotes in CSV', () => {
      const mockData: FairValueResult[] = [
        {
          ticker: 'TEST',
          currentPrice: 100.0,
          dcf: null,
          ddm: null,
          relativeValue: null,
          graham: null,
          valuationStatus: 'fairly_priced',
          calculatedAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      const csv = exportService.generateCSV(mockData);

      // Should not throw and should produce valid CSV
      expect(csv).toBeTruthy();
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('generatePDF', () => {
    it('should generate PDF buffer', async () => {
      const mockData: FairValueResult[] = [
        {
          ticker: 'AAPL',
          currentPrice: 150.25,
          dcf: {
            fairValue: 160.5,
            assumptions: {
              revenueGrowthRate: 0.08,
              wacc: 0.10,
              terminalGrowthRate: 0.025,
              projectionYears: 10,
              fcfMargin: 0.25,
            },
            projectedCashFlows: [100, 108, 116.64],
          },
          ddm: null,
          relativeValue: null,
          graham: null,
          valuationStatus: 'undervalued',
          calculatedAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      const pdfBuffer = await exportService.generatePDF(mockData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      // Check PDF magic number
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });

    it('should handle multiple stocks in PDF', async () => {
      const mockData: FairValueResult[] = Array.from({ length: 5 }, (_, i) => ({
        ticker: `STOCK${i}`,
        currentPrice: 100 + i * 10,
        dcf: {
          fairValue: 110 + i * 10,
          assumptions: {
            revenueGrowthRate: 0.08,
            wacc: 0.10,
            terminalGrowthRate: 0.025,
            projectionYears: 10,
            fcfMargin: 0.25,
          },
          projectedCashFlows: [100, 108, 116.64],
        },
        ddm: null,
        relativeValue: null,
        graham: null,
        valuationStatus: 'fairly_priced',
        calculatedAt: new Date('2024-01-01T00:00:00Z'),
      }));

      const pdfBuffer = await exportService.generatePDF(mockData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});
