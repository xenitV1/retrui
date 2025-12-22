import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure packages work correctly on Vercel serverless
  serverExternalPackages: ['cheerio', 'html-to-text'],
};

export default nextConfig;
