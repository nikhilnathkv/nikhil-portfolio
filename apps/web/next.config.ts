import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace packages (shipped as TypeScript source) as
  // part of the web build instead of expecting a pre-built dist bundle.
  transpilePackages: ['@nikhil-portfolio/types', '@nikhil-portfolio/ui'],
};

export default nextConfig;
