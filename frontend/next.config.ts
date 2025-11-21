import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment (Requirements: 19.2)
  // output: 'standalone', // Disabled for development
  
  // Enable experimental features for Next.js 16
  experimental: {
    // React compiler requires babel-plugin-react-compiler
    // reactCompiler: true,
  },
  
  // TypeScript configuration
  typescript: {
    // Type checking is handled by separate command
    ignoreBuildErrors: false,
  },
  
  // Image optimization (Requirements: 12.4)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compression (Requirements: 12.4)
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Strict mode
  reactStrictMode: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3001',
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ];
  },
  
  // Headers for security
  async headers() {
    return Promise.resolve([
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]);
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      };
    }
    
    return config;
  },
};

// @ts-ignore - Next.js version compatibility issue
export default withNextIntl(nextConfig);