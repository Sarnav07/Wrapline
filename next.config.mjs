/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Optional deps pulled in by wagmi/walletconnect, not used in the browser.
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
