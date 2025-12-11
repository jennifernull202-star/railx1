/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail build on ESLint warnings (unused vars, etc.)
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'railx-uploads.s3.us-east-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.therailexchange.com',
        pathname: '/api/s3-image/**',
      },
    ],
  },
};

export default nextConfig;
