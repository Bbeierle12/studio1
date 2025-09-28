import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Map Vercel environment variables to expected names
    DATABASE_URL: process.env.family_recipes_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db',
    NEXTAUTH_SECRET: process.env.family_recipes_NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET,
    OPENAI_API_KEY: process.env.family_recipes_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  },
  eslint: {
    // Ignore ESLint during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds for deployment
    ignoreBuildErrors: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
