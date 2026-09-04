import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['imap-simple', 'mailparser'],
  /* config options here */
};

export default nextConfig;
