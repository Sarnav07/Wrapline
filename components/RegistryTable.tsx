"use client";

import { useEffect, useState } from "react";
import { mainnet } from "wagmi/chains";
import type { Address } from "viem";
import { useAllChainsPairs, type RegistryRow } from "@/lib/registry";

function explorerBase(chainId: number) {
  return chainId === mainnet.id ? "https://etherscan.io" : "https://sepolia.etherscan.io";
}

function short(address: Address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function AddressLink({ address, chainId }: { address: Address; chainId: number }) {
  return (
    <a
      href={`${explorerBase(chainId)}/address/${address}`}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-xs text-[#94A2B8] hover:text-accent-blue"
    >
      {short(address)}
    </a>
  );
}

function NetworkBadge({ chainId }: { chainId: number }) {
  const isMainnet = chainId === mainnet.id;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ring-1 ${
        isMainnet
          ? "bg-violet-400/10 text-violet-300 ring-violet-400/30"
          : "bg-amber-400/10 text-amber-300 ring-amber-400/30"
      }`}
    >
      {isMainnet ? "Mainnet" : "Sepolia"}
    </span>
  );
}

function PairRow({ row }: { row: RegistryRow }) {
  return (
    <tr className={`border-t border-white/5${row.isValid ? "" : " opacity-50"}`}>
      <td className="py-3 pr-4">
        <NetworkBadge chainId={row.chainId} />
      </td>
      <td className="py-3 pr-4">
        <div className="font-medium">{row.underlying.symbol}</div>
        <AddressLink address={row.erc20Address} chainId={row.chainId} />
      </td>
      <td className="py-3 pr-4 text-center text-[#7A8699]">→</td>
      <td className="py-3 pr-4">
        <div className="font-medium">{row.confidential.symbol}</div>
        <AddressLink address={row.confidentialTokenAddress} chainId={row.chainId} />
      </td>
      <td className="py-3 pr-4 text-right tabular-nums text-[#94A2B8]">{row.underlying.decimals}</td>
      <td className="py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          {!row.isValid && (
            <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-xs text-rose-300 ring-1 ring-rose-400/30">
              deprecated
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs ring-1 ${
              row.source === "custom"
                ? "bg-accent-blue/10 text-accent-blue ring-accent-blue/30"
                : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"
            }`}
          >
            {row.source}
          </span>
        </div>
      </td>
    </tr>
  );
}

function RegistryInner() {
  const { rows, isLoading, isError } = useAllChainsPairs();
  const total = rows.length;

  return (
    <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Registry</h2>
          {!isLoading && !isError && total > 0 && (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#94A2B8] ring-1 ring-white/10">
              {total} {total === 1 ? "pair" : "pairs"} · Sepolia + Mainnet
            </span>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-lg border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200">
          <p>Couldn&apos;t load the registry. Check your connection and reload.</p>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="mt-6 text-sm text-[#7A8699]">
          No pairs found. Add one in <code className="text-[#94A2B8]">config/pairs.ts</code>.
        </p>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-[#7A8699]">
                <th className="pb-2 pr-4 font-medium">Network</th>
                <th className="pb-2 pr-4 font-medium">ERC-20</th>
                <th className="pb-2 pr-4" />
                <th className="pb-2 pr-4 font-medium">ERC-7984</th>
                <th className="pb-2 pr-4 text-right font-medium">Decimals</th>
                <th className="pb-2 text-right font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <PairRow key={`${row.chainId}-${row.confidentialTokenAddress}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Post-mount gate: avoids SSR mismatch before hydration completes. */
export function RegistryTable() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Registry</h2>
        </div>
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </section>
    );
  }

  return <RegistryInner />;
}
