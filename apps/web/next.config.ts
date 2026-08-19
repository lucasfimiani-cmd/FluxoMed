import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fluxomed/shared"],
  output: "standalone",
  // Garante que o engine nativo do Prisma seja incluído no trace do standalone
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/**/*"],
  },
};

export default nextConfig;