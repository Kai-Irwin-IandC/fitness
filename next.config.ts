import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // a stray lockfile in the home directory otherwise makes Next.js guess the wrong workspace root
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
