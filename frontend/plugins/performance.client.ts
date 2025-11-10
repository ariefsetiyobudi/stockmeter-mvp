export default defineNuxtPlugin(() => {
  if (process.client) {
    // Monitor page load performance
    window.addEventListener('load', () => {
      if ('performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        // Log performance metrics (can be sent to analytics)
        if (pageLoadTime > 0) {
          console.log(`Page load time: ${pageLoadTime}ms`);
          
          // Warn if page load is slow (> 3 seconds on 4G)
          if (pageLoadTime > 3000) {
            console.warn('Page load time exceeds 3 seconds');
          }
        }
      }
    });

    // Monitor First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              console.log(`FCP: ${entry.startTime}ms`);
            }
          }
        });
        
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }

    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`LCP: ${lastEntry.startTime}ms`);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }
});
