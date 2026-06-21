import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./src/fonts/**/*"],
  },
};

export default nextConfig;
