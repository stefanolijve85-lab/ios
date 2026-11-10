/** @type {import('next').NextConfig} */
const exporteren = process.env.BT_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `BT_EXPORT=1 npm run build` maakt een statische versie in out/ (voor een snelle preview-link)
  ...(exporteren ? { output: "export" } : {}),
  images: {
    unoptimized: exporteren,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920, 2400],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};
export default nextConfig;
