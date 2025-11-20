import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  getCurrencySymbol, 
  getCurrencyName,
  SUPPORTED_CURRENCIES 
} from './currency';

describe('Currency Utility', () => {
  describe('formatCurrency', () => {
    it('should format USD with symbol', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toBe('$1,234.56');
    });

    it('should format EUR with symbol', () => {
      const result = formatCurrency(1234.56, 'EUR');
      expect(result).toBe('€1,234.56');
    });

    it('should format without symbol when showSymbol is false', () => {
      const result = formatCurrency(1234.56, 'USD', { showSymbol: false });
      expect(result).toBe('1,234.56');
    });

    it('should include currency code when showCode is true', () => {
      const result = formatCurrency(1234.56, 'USD', { showCode: true });
      expect(result).toBe('$1,234.56 USD');
    });

    it('should respect custom decimal places', () => {
      const result = formatCurrency(1234.567, 'USD', { decimals: 3 });
      expect(result).toBe('$1,234.567');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return correct symbol for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return default symbol for unknown currency', () => {
      expect(getCurrencySymbol('UNKNOWN')).toBe('$');
    });
  });

  describe('getCurrencyName', () => {
    it('should return correct name for USD', () => {
      expect(getCurrencyName('USD')).toBe('US Dollar');
    });

    it('should return correct name for IDR', () => {
      expect(getCurrencyName('IDR')).toBe('Indonesian Rupiah');
    });

    it('should return default name for unknown currency', () => {
      expect(getCurrencyName('UNKNOWN')).toBe('US Dollar');
    });
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('should include USD', () => {
      const usd = SUPPORTED_CURRENCIES.find(c => c.code === 'USD');
      expect(usd).toBeDefined();
      expect(usd?.symbol).toBe('$');
    });

    it('should include IDR', () => {
      const idr = SUPPORTED_CURRENCIES.find(c => c.code === 'IDR');
      expect(idr).toBeDefined();
      expect(idr?.symbol).toBe('Rp');
    });

    it('should have at least 10 currencies', () => {
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(10);
    });
  });
});
