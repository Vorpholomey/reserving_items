import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents: true, // Disabled — conflicts with next-auth headers() in edge runtime
  // partialPrefetching: true, // Disabled — requires cacheComponents
  output: 'standalone',
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
