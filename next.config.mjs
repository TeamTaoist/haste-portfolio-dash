/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
    {
      protocol: "https",
      hostname: "static.cx.metamask.io", // if your website has no www, drop it
    },
    {
      protocol: "http",
      hostname: "localhost",
    }],
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
