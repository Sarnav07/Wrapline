import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
export const MAINNET_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

export const wagmiConfig = getDefaultConfig({
  appName: "Wrapline",
  // `||` so an empty-string env var also falls back to the dev id. Get a real
  // WalletConnect id from https://cloud.reown.com; injected wallets work without one.
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "WRAPLINE_DEV_PROJECT_ID",
  // Sepolia first makes it the default chain.
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
    [mainnet.id]: http(MAINNET_RPC),
  },
  ssr: true,
});

export const SUPPORTED_NETWORKS: Record<number, string> = {
  [sepolia.id]: "Sepolia",
  [mainnet.id]: "Ethereum Mainnet",
};
