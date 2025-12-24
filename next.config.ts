import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // TypeScript errors now fail build (previously ignored)
  typescript: {
    ignoreBuildErrors: false,
  },
  // React Strict Mode helps detect side effects and unsafe lifecycle
  reactStrictMode: true,
  // Ensure packages work correctly on Vercel serverless
  // Note: RSS/content fetching is now handled by Rust API

  // Proxy API requests to Rust backend
  async rewrites() {
    const rustApiUrl = process.env.RUST_API_URL || 'http://localhost:8080';

    return [
      {
        source: '/api/fetch-rss',
        destination: `${rustApiUrl}/api/fetch-rss`,
      },
      {
        source: '/api/fetch-content',
        destination: `${rustApiUrl}/api/fetch-content`,
      },
    ];
  },
};

export default nextConfig;
