"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { WagmiProvider, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { getChainId } from "wagmi/actions";
import { mainnet, sepolia } from "wagmi/chains";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { EIP1193Provider, PublicClient, WalletClient } from "viem";
import {
  ZamaProvider,
  RelayerWeb,
  SepoliaConfig,
  MainnetConfig,
  indexedDBStorage,
} from "@zama-fhe/react-sdk";
import { ViemSigner } from "@zama-fhe/sdk/viem";
import { wagmiConfig, SEPOLIA_RPC, MAINNET_RPC } from "@/lib/wagmi";

const rkTheme = darkTheme({
  accentColor: "#FFC83D",
  accentColorForeground: "#0B0E14",
  borderRadius: "large",
  overlayBlur: "small",
});

// ViemSigner instead of the SDK's WagmiSigner shim: the shim imports a
// wagmi-v3-only export and breaks the locked wagmi v2 + RainbowKit v2 stack.
function FheProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();

  // Created once; resolves the active chain lazily via getChainId.
  const relayer = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new RelayerWeb({
      getChainId: async () => getChainId(wagmiConfig),
      transports: {
        [sepolia.id]: { ...SepoliaConfig, ...(SEPOLIA_RPC ? { network: SEPOLIA_RPC } : {}) },
        [mainnet.id]: { ...MainnetConfig, ...(MAINNET_RPC ? { network: MAINNET_RPC } : {}) },
      },
    });
  }, []);

  // Rebuilt on wallet client or chain change so network switching stays transparent.
  const signer = useMemo(() => {
    if (typeof window === "undefined" || !publicClient) return null;
    return new ViemSigner({
      publicClient: publicClient as unknown as PublicClient,
      walletClient: (walletClient as unknown as WalletClient) ?? undefined,
      ethereum: (window as unknown as { ethereum?: EIP1193Provider }).ethereum,
    });
  }, [publicClient, walletClient]);

  if (!mounted || !relayer || !signer) return <>{children}</>;
  return (
    <ZamaProvider relayer={relayer} signer={signer} storage={indexedDBStorage}>
      {children}
    </ZamaProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} initialChain={sepolia} modalSize="compact">
          <FheProvider>{children}</FheProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
