'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import apiClient from '@/lib/api-client';
import type {
  StockSearchResult,
  StockProfile,
  FairValueResult,
} from '@/types';

/**
 * Hook for searching stocks with debouncing (300ms)
 * Requirements: 1.1, 1.2
 */
export function useStockSearch(query: string): UseQueryResult<StockSearchResult[], Error> {
  // Debounce the query by 300ms
  const [debouncedQuery] = useDebounce(query, 300);

  return useQuery({
    queryKey: ['stocks', 'search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      const response = await apiClient.get<StockSearchResult[]>('/api/stocks/search', {
        params: { q: debouncedQuery },
      });

      return response.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching stock detail (profile + price)
 * Requirements: 2.1
 */
export function useStockDetail(ticker: string): UseQueryResult<StockProfile, Error> {
  return useQuery({
    queryKey: ['stocks', ticker, 'detail'],
    queryFn: async () => {
      const response = await apiClient.get<StockProfile>(`/api/stocks/${ticker}`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching fair value calculations
 * Requirements: 2.1
 */
export function useFairValue(ticker: string): UseQueryResult<FairValueResult, Error> {
  return useQuery({
    queryKey: ['stocks', ticker, 'fairvalue'],
    queryFn: async () => {
      const response = await apiClient.get<FairValueResult>(`/api/stocks/${ticker}/fairvalue`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook for fetching model details (Pro only)
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export function useModelDetails(ticker: string): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ['stocks', ticker, 'modeldetails'],
    queryFn: async () => {
      const response = await apiClient.get(`/api/stocks/${ticker}/modeldetails`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook for batch comparison (Pro only)
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function useBatchComparison(tickers: string[]): UseQueryResult<FairValueResult[], Error> {
  return useQuery({
    queryKey: ['stocks', 'compare', tickers.sort().join(',')],
    queryFn: async () => {
      const response = await apiClient.post<FairValueResult[]>('/api/stocks/compare', {
        tickers,
      });
      return response.data;
    },
    enabled: tickers.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook for fetching watchlist with enriched data
 * Requirements: 5.2
 */
export function useWatchlistData(tickers: string[]): UseQueryResult<FairValueResult[], Error> {
  return useQuery({
    queryKey: ['watchlist', 'data', tickers.sort().join(',')],
    queryFn: async () => {
      if (tickers.length === 0) return [];
      
      // Fetch fair values for all watchlist stocks
      const promises = tickers.map((ticker) =>
        apiClient.get<FairValueResult>(`/api/stocks/${ticker}/fairvalue`)
      );
      
      const responses = await Promise.all(promises);
      return responses.map((res) => res.data);
    },
    enabled: tickers.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
