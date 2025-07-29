import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Point to the request configuration file we just created
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    domains: ["res.cloudinary.com"],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // Increase the maximum allowed request body size for Server Actions (default is 1MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Increase to 10MB for file uploads
    },
  },

  // API configuration has been moved to route handlers in Next.js 15
};

export default withNextIntl(nextConfig);
