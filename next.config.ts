import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Disable service worker in development (Turbopack doesn't support serwist's webpack plugin)
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  output: "export",
  // Image optimization is not available in static export
  images: { unoptimized: true },
  // Empty turbopack config silences the "no turbopack config" error in dev
  turbopack: {},
};

export default withSerwist(nextConfig);
