import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel provides its own Next.js deployment adapter. Using the standalone
  // server output there is unnecessary and can conflict with Vercel's build
  // tracing. Keep standalone output only for self-hosted/Docker builds.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
