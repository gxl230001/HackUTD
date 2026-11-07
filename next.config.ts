import type { NextConfig } from "next";

// When testing on a phone over Wi-Fi, the dev server only trusts localhost and
// the hostname it was started with. Set ALLOWED_DEV_ORIGINS to your Mac's LAN
// IP (comma-separated for several), e.g.
//   ALLOWED_DEV_ORIGINS=$(ipconfig getifaddr en0) npm run dev:lan
// so no IP address is hardcoded here. Only affects `next dev`.
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins,
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
