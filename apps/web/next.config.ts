import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fluxomed/shared"],
  output: "standalone",
};

export default nextConfig;