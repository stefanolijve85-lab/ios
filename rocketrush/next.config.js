/** @type {import('next').NextConfig} */
const nextConfig = {
  // The game engine owns the DOM imperatively for 60fps; double-invoking
  // effects in dev would start two loops, so we keep strict mode off.
  reactStrictMode: false,
};

module.exports = nextConfig;
