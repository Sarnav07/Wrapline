"use client";

import { useChainId, useSwitchChain } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

const NETWORKS = [
  { id: sepolia.id, label: "Sepolia" },
  { id: mainnet.id, label: "Ethereum" },
] as const;

/**
 * Switches the connected wallet between Sepolia and mainnet. The registry table
 * reads from the active chain, so this drives which pairs are shown. Requires a
 * connected wallet — chain switching goes through the wallet.
 */
export function NetworkToggle() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  return (
    <div className="inline-flex rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
      {NETWORKS.map((network) => {
        const active = chainId === network.id;
        return (
          <button
            key={network.id}
            type="button"
            disabled={isPending || active}
            onClick={() => switchChain({ chainId: network.id })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-default ${
              active
                ? "bg-[#FFC83D] text-[#0B0E14]"
                : "text-[#94A2B8] hover:text-[#EAF0FA] disabled:opacity-50"
            }`}
          >
            {network.label}
          </button>
        );
      })}
    </div>
  );
}
