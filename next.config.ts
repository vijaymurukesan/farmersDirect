import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore problematic node_modules that cause build issues
      config.externals = config.externals || [];
      
      // Don't try to bundle pdfkit - let it use its own font files
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }
      
      config.externals.push('canvas');
      config.externals.push('pdfkit');
      
      // Allow .afm and .png files to be loaded
      config.module.rules.push({
        test: /\.(afm|png)$/,
        type: 'asset/resource',
      });
    }
    return config;
  },
};

export default nextConfig;
