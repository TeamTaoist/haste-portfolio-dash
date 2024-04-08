/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['static.cx.metamask.io'],
  },
  webpack(config, { nextRuntime }) { 
    // as of Next.js latest versions, the nextRuntime is preferred over `isServer`, because of edge-runtime
    if (typeof nextRuntime === "undefined") {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };  
    }
    return config;
  },
};

export default nextConfig;
