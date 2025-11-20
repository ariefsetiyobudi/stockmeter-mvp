'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { isNetworkError, isErrorStatus } from './api-client';

/**
 * React Query provider with retry logic for transient failures
 * Requirements: All - Global error handling and retry logic
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            
            // Retry logic for transient failures
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (isErrorStatus(error, 400) || 
                  isErrorStatus(error, 401) || 
                  isErrorStatus(error, 403) || 
                  isErrorStatus(error, 404)) {
                return false;
              }
              
              // Retry network errors and 5xx errors up to 2 times
              if (isNetworkError(error) || 
                  isErrorStatus(error, 500) || 
                  isErrorStatus(error, 502) || 
                  isErrorStatus(error, 503) || 
                  isErrorStatus(error, 504)) {
                return failureCount < 2;
              }
              
              // Retry rate limit errors once after a delay
              if (isErrorStatus(error, 429)) {
                return failureCount < 1;
              }
              
              // Default: retry once
              return failureCount < 1;
            },
            
            // Exponential backoff for retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations for network errors only
            retry: (failureCount, error) => {
              if (isNetworkError(error)) {
                return failureCount < 2;
              }
              return false;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children as any}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
