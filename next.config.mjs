/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Optional deps pulled in by wagmi/walletconnect, not used in the browser.
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // @metamask/sdk optionally imports this React Native storage module, which
    // isn't present (or needed) in a web build. Resolve it to nothing.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
