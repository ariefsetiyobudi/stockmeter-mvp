/**
 * Performance monitoring utilities
 * Requirements: 12.4 - Mobile performance optimization
 */

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to analytics service (Google Analytics, etc.)
    // Example: gtag('event', metric.name, { value: metric.value });
  }
}

/**
 * Measure page load time
 */
export function measurePageLoad() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    console.log(`Page load time: ${pageLoadTime}ms`);
    
    // Check if page load is within 3 seconds (Requirements: 12.4)
    if (pageLoadTime > 3000) {
      console.warn('Page load time exceeds 3 seconds target');
    }
  });
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages() {
  if (typeof window === 'undefined') return;
  
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Prefetch critical resources
 */
export function prefetchResources(urls: string[]) {
  if (typeof window === 'undefined') return;
  
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check network connection quality
 */
export function getNetworkQuality(): 'slow' | 'fast' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return 'unknown';
  
  // Check effective type (4g, 3g, 2g, slow-2g)
  if (connection.effectiveType === '4g') return 'fast';
  if (connection.effectiveType === '3g') return 'fast';
  
  return 'slow';
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
