import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.1.8', 'localhost:3000'],
  reactCompiler: true,
};

export default nextConfig;
