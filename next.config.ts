import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['imap-simple', 'mailparser'],
  },
  /* config options here */
};

export default nextConfig;
