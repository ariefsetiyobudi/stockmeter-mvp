/**
 * Centralized API client with error handling and retry logic
 * Requirements: All - Global error handling for API calls
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token is handled via httpOnly cookies, but we can add additional headers if needed
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Success response - return as is
    return response;
  },
  async (error: AxiosError) => {
    // Handle different error scenarios
    if (!error.response) {
      // Network error - no response from server
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const errorData = error.response.data as any;
    const errorMessage = errorData?.error?.message || errorData?.message || 'An error occurred';

    switch (status) {
      case 400:
        // Bad request - validation error
        toast.error(errorMessage);
        break;

      case 401:
        // Unauthorized - redirect to login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          toast.error('Session expired. Please login again.');
          // Small delay to show toast before redirect
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        break;

      case 403:
        // Forbidden - insufficient permissions
        if (errorMessage.toLowerCase().includes('pro') || errorMessage.toLowerCase().includes('subscription')) {
          toast.error('This feature requires a Pro subscription.');
        } else {
          toast.error('You do not have permission to perform this action.');
        }
        break;

      case 404:
        // Not found
        toast.error('Resource not found.');
        break;

      case 429:
        // Rate limit exceeded
        toast.error('Too many requests. Please try again later.');
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        toast.error('Server error. Please try again later.');
        break;

      default:
        // Other errors
        toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };

/**
 * Helper function to handle API errors with custom messages
 */
export function handleApiError(error: unknown, customMessage?: string): string {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data as any;
    return errorData?.error?.message || errorData?.message || customMessage || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return customMessage || 'An unexpected error occurred';
}

/**
 * Helper function to check if error is a specific status code
 */
export function isErrorStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}

/**
 * Helper function to check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
