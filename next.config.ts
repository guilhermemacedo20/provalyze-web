import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@react-pdf/renderer"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;