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
  serverExternalPackages: ['@extractus/article-extractor'],
  // Fix eslint directory issue
  eslint: {
    dirs: ['src'],
  },
};

export default nextConfig;
