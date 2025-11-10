# Performance Optimization Guide

## Overview

This document outlines the performance optimizations implemented in the Stockmeter frontend application to ensure fast load times and smooth user experience, especially on mobile devices.

## Key Optimizations

### 1. Code Splitting

- **Vendor Chunking**: Separated vendor libraries (Vue, Pinia, i18n) into separate chunks
- **Route-based Splitting**: Each page is loaded on-demand
- **Component Lazy Loading**: Heavy components are loaded only when needed

### 2. Image Optimization

- **Lazy Loading**: All images use `loading="lazy"` attribute
- **Modern Formats**: Support for WebP and AVIF formats
- **Responsive Images**: Different sizes for different screen sizes
- **Compression**: Images compressed to 80% quality

### 3. CSS Optimization

- **TailwindCSS Purging**: Unused CSS classes are removed in production
- **Critical CSS**: Inline critical CSS for above-the-fold content
- **GPU Acceleration**: Transform properties for smooth animations

### 4. JavaScript Optimization

- **Tree Shaking**: Unused code is removed during build
- **Minification**: All JavaScript is minified in production
- **Compression**: Gzip/Brotli compression enabled

### 5. Network Optimization

- **Preconnect**: DNS prefetch for API endpoints
- **Prefetch**: Common routes prefetched after initial load
- **HTTP/2**: Multiple requests multiplexed over single connection
- **Caching**: Aggressive caching for static assets

### 6. Mobile-Specific Optimizations

- **Touch Targets**: Minimum 44px touch targets for all interactive elements
- **Tap Highlight**: Removed default tap highlight for better UX
- **Viewport**: Optimized viewport meta tag
- **Orientation Support**: Layouts adapt to portrait and landscape modes

### 7. Performance Monitoring

- **Web Vitals**: Monitoring FCP, LCP, CLS, FID
- **Performance API**: Tracking page load times
- **Network Detection**: Adapting content based on connection speed

## Performance Targets

### Desktop
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.0s
- **Total Blocking Time (TBT)**: < 300ms

### Mobile (4G)
- **First Contentful Paint (FCP)**: < 2.0s
- **Largest Contentful Paint (LCP)**: < 3.0s
- **Time to Interactive (TTI)**: < 4.0s
- **Total Blocking Time (TBT)**: < 400ms

## Testing Performance

### Local Testing

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Run Lighthouse audit (requires Chrome)
npm run lighthouse        # Desktop
npm run lighthouse:mobile # Mobile
```

### Manual Testing

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Mobile" or "Desktop"
4. Click "Generate report"
5. Review scores and recommendations

### Network Throttling

Test on different network conditions:
- Fast 3G
- Slow 3G
- Offline

## Best Practices

### When Adding New Features

1. **Lazy Load Heavy Components**
   ```vue
   <script setup>
   const HeavyComponent = defineAsyncComponent(() => 
     import('./HeavyComponent.vue')
   );
   </script>
   ```

2. **Use Lazy Loading for Images**
   ```vue
   <OptimizedImage src="/path/to/image.jpg" alt="Description" />
   ```

3. **Optimize API Calls**
   - Debounce user input (300ms)
   - Cache responses when appropriate
   - Use pagination for large datasets

4. **Minimize Bundle Size**
   - Import only what you need
   - Use tree-shakeable libraries
   - Avoid large dependencies

5. **Test on Real Devices**
   - Test on actual mobile devices
   - Use Chrome DevTools device emulation
   - Test on slow networks

## Monitoring in Production

### Metrics to Track

- Page load time
- API response times
- Error rates
- User engagement metrics

### Tools

- Google Analytics
- Google Search Console
- Sentry (error tracking)
- Custom performance monitoring

## Common Issues and Solutions

### Slow Initial Load

- Check bundle size with `npm run build:analyze`
- Ensure code splitting is working
- Verify images are optimized
- Check for blocking scripts

### Slow Navigation

- Ensure route prefetching is enabled
- Check for unnecessary API calls
- Verify component lazy loading

### Poor Mobile Performance

- Test on real devices
- Check touch target sizes
- Verify responsive images
- Test on slow networks

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Nuxt Performance Guide](https://nuxt.com/docs/guide/going-further/performance)
- [TailwindCSS Optimization](https://tailwindcss.com/docs/optimizing-for-production)
