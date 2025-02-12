import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    ],
  },
};

export default nextConfig;
