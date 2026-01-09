import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore problematic node_modules that cause build issues
      config.externals = config.externals || [];
      
      // Don't try to bundle pdfkit - let it use its own font files
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }
      
      config.externals.push('canvas');
      
      // Allow .afm and .png files to be loaded
      config.module.rules.push({
        test: /\.(afm|png)$/,
        type: 'asset/resource',
      });
    }
    return config;
  },
  // Ensure serverComponentsExternalPackages includes pdfkit
  serverComponentsExternalPackages: ['pdfkit'],
};

export default nextConfig;
