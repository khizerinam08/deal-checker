import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.dominos.com.pk',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
