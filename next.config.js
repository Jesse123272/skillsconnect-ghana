/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permissive during build to support mixed JS/TS in the workspace
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'picsum.photos',
      'images.unsplash.com',
      'res.cloudinary.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Expose the public Paystack key to the client side
  env: {
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || '',
  },
  // Transpile package for proper bundle loading of motion
  transpilePackages: ['motion'],
  serverExternalPackages: ['mysql2', 'sql.js'],
  webpack: (config, { dev }) => {
    // Maintain standard dev server performance and HMR disable settings for AI Studio
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
  // Next.js standard API body size limits are configured per-route-handler,
  // but we can add an experimental flag or comment for documentation
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
