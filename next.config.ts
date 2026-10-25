import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network devices (e.g. iPhone / Android connecting via WiFi IP 192.168.x.x)
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.1.151:3000",
    "192.168.1.151",
    "192.168.*",
  ],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
