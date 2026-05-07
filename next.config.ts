import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: false,

  async redirects() {
    return [
      {
        source: '/blog',
        destination: 'https://blog.onesugar.pt',
        permanent: true,
      },
      {
        source: '/blog/:path*',
        destination: 'https://blog.onesugar.pt/:path*',
        permanent: true,
      },
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
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
        hostname: 'images.ctfassets.net',
      },
    ],
  },
};

export default nextConfig;