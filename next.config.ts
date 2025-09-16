import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Skip linting during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip type checking during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
