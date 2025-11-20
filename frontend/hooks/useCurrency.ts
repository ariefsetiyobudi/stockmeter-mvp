'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { 
  convertCurrency, 
  formatCurrency, 
  getCurrencySymbol
} from '@/lib/currency';

/**
 * Hook to manage currency conversion and formatting
 * Requirements: 13.3, 13.4, 13.5
 */
export function useCurrency() {
  const { user } = useAuthStore();
  const [userCurrency, setUserCurrency] = useState<string>('USD');

  useEffect(() => {
    // Get user's currency preference
    if (user?.currencyPreference) {
      setUserCurrency(user.currencyPreference);
    }
  }, [user]);

  /**
   * Convert price from USD to user's preferred currency
   */
  const convertPrice = async (amountInUSD: number): Promise<number> => {
    if (userCurrency === 'USD') {
      return amountInUSD;
    }

    try {
      return await convertCurrency(amountInUSD, 'USD', userCurrency);
    } catch (error) {
      console.error('Error converting currency:', error);
      return amountInUSD;
    }
  };

  /**
   * Format price with user's currency symbol
   */
  const formatPrice = (amount: number, options?: {
    decimals?: number;
    showSymbol?: boolean;
    showCode?: boolean;
  }): string => {
    return formatCurrency(amount, userCurrency, options);
  };

  /**
   * Get user's currency symbol
   */
  const currencySymbol = getCurrencySymbol(userCurrency);

  return {
    userCurrency,
    setUserCurrency,
    convertPrice,
    formatPrice,
    currencySymbol,
  };
}
