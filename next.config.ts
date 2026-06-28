import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'www.gravatar.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
    ],
  },
};

export default nextConfig;
