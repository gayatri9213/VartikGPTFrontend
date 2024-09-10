/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
   output: 'export', // This enables static export
   images: {
    unoptimized: true, // Disable Image Optimization for static export
  },
};

export default nextConfig;
