'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStockSearch } from '@/hooks/useStockData';
import axios from 'axios';

// Validation schema
const alertFormSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker must be 10 characters or less'),
  thresholdType: z.enum(['undervalued', 'overvalued', 'fair'], {
    required_error: 'Threshold type is required',
  }),
  thresholdValue: z
    .number({ required_error: 'Threshold value is required' })
    .min(0, 'Threshold value must be at least 0')
    .max(100, 'Threshold value must be at most 100'),
});

type AlertFormData = z.infer<typeof alertFormSchema>;

interface AlertFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AlertForm({ onClose, onCreated }: AlertFormProps) {
  const [showTickerDropdown, setShowTickerDropdown] = useState(false);
  const [tickerQuery, setTickerQuery] = useState('');
  const [submitError, setSubmitError] = useState('');
  
  const { data: searchResults = [] } = useStockSearch(tickerQuery);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AlertFormData>({
    // @ts-ignore - Zod version compatibility issue
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      thresholdValue: 10,
    },
  });

  const handleTickerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTickerQuery(value);
    setValue('ticker', value.toUpperCase());
    
    if (value.length >= 2) {
      setShowTickerDropdown(true);
    } else {
      setShowTickerDropdown(false);
    }
  };

  const selectTicker = (ticker: string) => {
    setValue('ticker', ticker);
    setTickerQuery(ticker);
    setShowTickerDropdown(false);
  };

  const handleTickerBlur = () => {
    setTimeout(() => {
      setShowTickerDropdown(false);
    }, 200);
  };

  const onSubmit = async (data: AlertFormData) => {
    setSubmitError('');

    try {
      const apiBaseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001';
      
      await axios.post(
        `${apiBaseUrl}/api/alerts`,
        {
          ticker: data.ticker.toUpperCase(),
          thresholdType: data.thresholdType,
          thresholdValue: data.thresholdValue,
        },
        {
          withCredentials: true,
        }
      );

      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating alert:', error);
      
      if (error.response?.data?.error?.message) {
        setSubmitError(error.response.data.error.message);
      } else {
        setSubmitError('Failed to create alert. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Create Alert</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Ticker Input with Autocomplete */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticker
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter ticker symbol (e.g., AAPL)"
              className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base ${
                errors.ticker ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('ticker')}
              onChange={handleTickerInput}
              onFocus={() => tickerQuery.length >= 2 && setShowTickerDropdown(true)}
              onBlur={handleTickerBlur}
            />

            {/* Autocomplete Dropdown */}
            {showTickerDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.ticker}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectTicker(result.ticker);
                    }}
                  >
                    <div className="font-semibold text-sm">{result.ticker}</div>
                    <div className="text-xs text-gray-600 truncate">{result.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.ticker && (
            <p className="mt-1 text-sm text-red-600">{errors.ticker.message}</p>
          )}
        </div>

        {/* Threshold Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Threshold Type
          </label>
          <select
            className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base ${
              errors.thresholdType ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('thresholdType')}
          >
            <option value="">Select type</option>
            <option value="undervalued">Undervalued</option>
            <option value="overvalued">Overvalued</option>
            <option value="fair">Fairly Priced</option>
          </select>
          {errors.thresholdType && (
            <p className="mt-1 text-sm text-red-600">{errors.thresholdType.message}</p>
          )}
        </div>

        {/* Threshold Value Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Threshold Value
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="Enter percentage (0-100)"
              className={`w-full px-3 sm:px-4 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base ${
                errors.thresholdValue ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('thresholdValue', { valueAsNumber: true })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
          {errors.thresholdValue && (
            <p className="mt-1 text-sm text-red-600">{errors.thresholdValue.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Set the percentage threshold for triggering this alert
          </p>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px] text-sm sm:text-base"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 sm:py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </form>
    </div>
  );
}
