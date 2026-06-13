/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  // The app is served from a custom Node server (server.js) so that Next.js
  // and the Socket.io realtime layer share a single origin / single port.
};

module.exports = nextConfig;
