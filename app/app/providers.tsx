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
  usePublicKey,
} from "@zama-fhe/react-sdk";
import { ViemSigner } from "@zama-fhe/sdk/viem";
import { wagmiConfig, SEPOLIA_RPC, MAINNET_RPC } from "@/lib/wagmi";

const rkTheme = darkTheme({
  accentColor: "#F537A5",
  accentColorForeground: "#FFFFFF",
  borderRadius: "large",
  overlayBlur: "small",
});

// Loads the fhevm WASM instance + relayer key material up-front (usePublicKey ->
// RelayerWeb.getPublicKey -> the instance load). Without this, the first decrypt
// pays that multi-second load *before* signTypedData, which blows past the ~5s
// browser user-activation window so MetaMask can't auto-open its signature popup.
// Warming here means the later sign fires promptly within the click gesture.
function PrewarmFhe() {
  usePublicKey();
  return null;
}

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

  // Rebuilt only when the connection identity actually changes (account address +
  // chain id), not on every walletClient object-reference change. Keying on the
  // churning reference would recreate the whole ZamaSDK on incidental re-renders
  // and orphan an in-flight signature — the "confirmed but never reveals" bug.
  const walletKey = walletClient
    ? `${walletClient.account?.address}:${walletClient.chain?.id}`
    : "none";
  const signer = useMemo(() => {
    if (typeof window === "undefined" || !publicClient) return null;
    return new ViemSigner({
      publicClient: publicClient as unknown as PublicClient,
      walletClient: (walletClient as unknown as WalletClient) ?? undefined,
      ethereum: (window as unknown as { ethereum?: EIP1193Provider }).ethereum,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on walletKey, not the churning walletClient ref
  }, [publicClient, walletKey]);

  if (!mounted || !relayer || !signer) return <>{children}</>;
  return (
    <ZamaProvider relayer={relayer} signer={signer} storage={indexedDBStorage}>
      <PrewarmFhe />
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
