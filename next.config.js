/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { 
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json'
  },
  output: "standalone",
  eslint: {
    // Allow build to proceed even if linting issues exist
    ignoreDuringBuilds: false,
  },
  swcMinify: true,
  compress: true,
  optimizeFonts: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  staticPageGenerationTimeout: 180,
  // Optimize for Vercel
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
