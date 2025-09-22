import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '18mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'akns-images.eonline.com',
      },
      {
        protocol: 'https',
        hostname: 'vacjsnuttfzgcdaaqjxd.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net', // Contentful assets domain
      },
    ],
  },
};

export default nextConfig;
