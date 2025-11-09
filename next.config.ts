import type { NextConfig } from "next";

const nextConfig = {
  cacheComponents: true,
  // Enable standalone output for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Increase Server Actions body size to allow file uploads (e.g., cover images)
  experimental: {
    serverActions: {
      bodySizeLimit: 10 * 1024 * 1024, // 10 MB
    },
  },
  images: {
    // Use remotePatterns (domains is deprecated)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
} satisfies NextConfig;

export default nextConfig;
