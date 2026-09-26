import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow mobile testing via local IP
  allowedDevOrigins: ['192.168.56.1', '192.168.101.28', 'localhost'],
};

export default nextConfig;
