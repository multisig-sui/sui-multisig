/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle node polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Ensure proper module resolution
    config.resolve.extensions = [...config.resolve.extensions, '.mjs', '.cjs'];
    
    return config;
  },
  serverExternalPackages: ['poseidon-lite'],
}

export default nextConfig
