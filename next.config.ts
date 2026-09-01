import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, too small for a real phone-camera dog photo.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
