'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
            <p className="text-xl text-gray-400 mb-8">Page not found</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go back home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
