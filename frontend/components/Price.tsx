'use client';

import { useEffect, useState } from 'react';
import { useCurrency } from '@/hooks/useCurrency';

interface PriceProps {
  amount: number;
  currency?: string;
  decimals?: number;
  showSymbol?: boolean;
  showCode?: boolean;
  className?: string;
}

/**
 * Price component that automatically converts and formats prices
 * based on user's currency preference
 * Requirements: 13.3, 13.5
 */
export default function Price({
  amount,
  currency = 'USD',
  decimals = 2,
  showSymbol = true,
  showCode = false,
  className = '',
}: PriceProps) {
  const { userCurrency, convertPrice, formatPrice } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const convert = async () => {
      setIsLoading(true);
      
      if (currency === userCurrency) {
        setConvertedAmount(amount);
        setIsLoading(false);
        return;
      }

      try {
        const converted = await convertPrice(amount);
        setConvertedAmount(converted);
      } catch (error) {
        console.error('Error converting price:', error);
        setConvertedAmount(amount);
      } finally {
        setIsLoading(false);
      }
    };

    convert();
  }, [amount, currency, userCurrency, convertPrice]);

  if (isLoading) {
    return (
      <span className={`inline-block animate-pulse bg-gray-200 rounded ${className}`}>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </span>
    );
  }

  const formattedPrice = formatPrice(convertedAmount, {
    decimals,
    showSymbol,
    showCode,
  });

  return <span className={className}>{formattedPrice}</span>;
}
