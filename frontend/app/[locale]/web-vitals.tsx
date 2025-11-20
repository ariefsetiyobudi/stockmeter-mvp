'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals } from '@/lib/performance';

/**
 * Web Vitals reporter component
 * Requirements: 12.4 - Monitor page load performance
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    reportWebVitals(metric);
  });
  
  useEffect(() => {
    // Measure page load time on mount
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Page load time: ${pageLoadTime}ms`);
          
          // Check if page load is within 3 seconds (Requirements: 12.4)
          if (pageLoadTime > 3000) {
            console.warn('⚠️ Page load time exceeds 3 seconds target');
          } else {
            console.log('✅ Page load time is within 3 seconds target');
          }
        }
      });
    }
  }, []);
  
  return null;
}
