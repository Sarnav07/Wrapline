"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

const SUPPORTED = [sepolia.id, mainnet.id] as const;

/**
 * Inline guard for the action panels: if the wallet is connected to a chain we
 * don't support, show a one-click switch to Sepolia (the default test network).
 * Renders nothing when disconnected or already on a supported chain — panels
 * stay clean in the happy path.
 */
export function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || (SUPPORTED as readonly number[]).includes(chainId)) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
      <p className="text-xs text-amber-200">
        Unsupported network (chain {chainId}). Switch to continue.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="rounded-md bg-accent-blue px-3 py-1.5 text-xs font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
        >
          {isPending ? "Switching…" : "Switch to Sepolia"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => switchChain({ chainId: mainnet.id })}
          className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-[#94A2B8] ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
        >
          Ethereum
        </button>
      </div>
    </div>
  );
}
