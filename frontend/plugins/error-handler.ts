/**
 * Global Error Handler Plugin
 * Handles API errors, network errors, and provides retry logic
 */

export default defineNuxtPlugin((nuxtApp) => {
  const { error: showErrorToast } = useToast();
  const router = useRouter();

  // Handle Vue errors
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('Vue Error:', error, info);
    
    // Show user-friendly error message
    showErrorToast('An unexpected error occurred. Please try again.');
  };

  // Handle unhandled promise rejections
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      
      // Show user-friendly error message
      showErrorToast('An unexpected error occurred. Please try again.');
      
      // Prevent default browser error handling
      event.preventDefault();
    });
  }

  // Global fetch error handler with retry logic
  const originalFetch = globalThis.$fetch;

  globalThis.$fetch = new Proxy(originalFetch, {
    apply: async (target, thisArg, argumentsList) => {
      const maxRetries = 2;
      let lastError: any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await Reflect.apply(target, thisArg, argumentsList);
          return result;
        } catch (error: any) {
          lastError = error;

          // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
          if (
            error.statusCode &&
            error.statusCode >= 400 &&
            error.statusCode < 500 &&
            error.statusCode !== 408 &&
            error.statusCode !== 429
          ) {
            break;
          }

          // Don't retry on last attempt
          if (attempt === maxRetries) {
            break;
          }

          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));

          console.log(`Retrying request (attempt ${attempt + 2}/${maxRetries + 1})...`);
        }
      }

      // Handle specific error cases
      handleAPIError(lastError, router, showErrorToast);

      throw lastError;
    },
  });

  // Provide error handler utilities
  return {
    provide: {
      handleError: (error: any, customMessage?: string) => {
        handleAPIError(error, router, showErrorToast, customMessage);
      },
    },
  };
});

/**
 * Handle API errors with appropriate user feedback
 */
function handleAPIError(
  error: any,
  router: any,
  showErrorToast: (message: string) => void,
  customMessage?: string
) {
  // Network error
  if (!error.statusCode && error.message?.includes('fetch')) {
    showErrorToast(
      customMessage || 'Network error. Please check your connection and try again.'
    );
    return;
  }

  // Handle specific status codes
  switch (error.statusCode) {
    case 400:
      showErrorToast(
        customMessage ||
          error.data?.error?.message ||
          'Invalid request. Please check your input.'
      );
      break;

    case 401:
      showErrorToast(
        customMessage || 'Your session has expired. Please log in again.'
      );
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      break;

    case 403:
      const errorData = error.data?.error;
      if (errorData?.code === 'PRO_SUBSCRIPTION_REQUIRED') {
        showErrorToast(
          customMessage ||
            'This feature requires a Pro subscription. Upgrade to continue.'
        );
        // Optionally redirect to pricing
        setTimeout(() => {
          router.push('/pricing');
        }, 3000);
      } else if (errorData?.code === 'SUBSCRIPTION_EXPIRED') {
        showErrorToast(
          customMessage ||
            'Your Pro subscription has expired. Please renew to continue.'
        );
        setTimeout(() => {
          router.push('/pricing');
        }, 3000);
      } else {
        showErrorToast(
          customMessage ||
            error.data?.error?.message ||
            'You do not have permission to perform this action.'
        );
      }
      break;

    case 404:
      showErrorToast(
        customMessage ||
          error.data?.error?.message ||
          'The requested resource was not found.'
      );
      break;

    case 408:
      showErrorToast(
        customMessage || 'Request timeout. Please try again.'
      );
      break;

    case 429:
      showErrorToast(
        customMessage ||
          'Too many requests. Please wait a moment and try again.'
      );
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      showErrorToast(
        customMessage ||
          'Server error. Our team has been notified. Please try again later.'
      );
      break;

    default:
      showErrorToast(
        customMessage ||
          error.data?.error?.message ||
          'An unexpected error occurred. Please try again.'
      );
  }
}
