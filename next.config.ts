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
  // Ensure API routes work correctly on Vercel
  experimental: {
    serverComponentsExternalPackages: ['jsdom', '@mozilla/readability'],
  },
};

export default nextConfig;
