'use client';

import { useState, useTransition } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import toast from 'react-hot-toast';

interface CurrencySelectorProps {
  currentCurrency: string;
  onCurrencyChange?: (currency: string) => void;
}

export default function CurrencySelector({ 
  currentCurrency, 
  onCurrencyChange 
}: CurrencySelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);

  const handleCurrencyChange = async (newCurrency: string) => {
    if (newCurrency === selectedCurrency) return;

    setSelectedCurrency(newCurrency);

    startTransition(async () => {
      try {
        // Save currency preference to backend
        const response = await fetch(`${process.env['NEXT_PUBLIC_API_BASE_URL']}/api/user/preferences`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ currencyPreference: newCurrency }),
        });

        if (!response.ok) {
          throw new Error('Failed to save currency preference');
        }

        toast.success('Currency preference updated');
        
        // Call the callback if provided
        if (onCurrencyChange) {
          onCurrencyChange(newCurrency);
        }
      } catch (error) {
        console.error('Error saving currency preference:', error);
        toast.error('Failed to save currency preference');
        // Revert to previous currency
        setSelectedCurrency(currentCurrency);
      }
    });
  };

  const currentCurrencyData = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  return (
    <Select.Root value={selectedCurrency} onValueChange={handleCurrencyChange} disabled={isPending}>
      <Select.Trigger
        className="inline-flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
        aria-label="Select currency"
      >
        <span className="flex items-center gap-2">
          <span className="font-semibold">{currentCurrencyData.symbol}</span>
          <span>{currentCurrencyData.code}</span>
          <span className="text-gray-500">-</span>
          <span className="text-gray-600">{currentCurrencyData.name}</span>
        </span>
        <Select.Icon>
          <ChevronDownIcon className="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 max-h-[300px]"
          position="popper"
          sideOffset={5}
        >
          <Select.Viewport className="p-1">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <Select.Item
                key={currency.code}
                value={currency.code}
                className="relative flex items-center gap-2 px-8 py-2 text-sm text-gray-900 rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none select-none"
              >
                <Select.ItemText>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold w-6">{currency.symbol}</span>
                    <span className="font-medium w-12">{currency.code}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-600">{currency.name}</span>
                  </span>
                </Select.ItemText>
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <CheckIcon className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
