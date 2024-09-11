/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // This enables static export
  images: {
    unoptimized: true, // Disable Image Optimization for static export
  },
};

module.exports = nextConfig; // Use CommonJS syntax here
