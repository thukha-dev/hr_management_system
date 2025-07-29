import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Point to the request configuration file we just created
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    domains: [],
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
      bodySizeLimit: '10mb', // Increase to 10MB for file uploads
    },
  },

  // For API routes
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default withNextIntl(nextConfig);
