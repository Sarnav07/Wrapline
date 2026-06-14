"use client";

import { useEffect, useState } from "react";
import { mainnet } from "wagmi/chains";
import type { Address } from "viem";
import { useRegistryPairs, type RegistryRow } from "@/lib/registry";
import { NetworkToggle } from "./NetworkToggle";

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
      className="font-mono text-xs text-[#94A2B8] hover:text-[#FFC83D]"
    >
      {short(address)}
    </a>
  );
}

function CoverageBadge({ total, onchain, custom }: { total: number; onchain: number; custom: number }) {
  return (
    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#94A2B8] ring-1 ring-white/10">
      {total} {total === 1 ? "pair" : "pairs"} · {onchain} onchain
      {custom > 0 ? ` · ${custom} custom` : ""}
    </span>
  );
}

function PairRow({ row }: { row: RegistryRow }) {
  return (
    <tr className="border-t border-white/5">
      <td className="py-3 pr-4">
        <div className="font-medium">{row.underlying.symbol}</div>
        <div className="text-xs text-[#7A8699]">{row.underlying.name}</div>
        <AddressLink address={row.erc20Address} chainId={row.chainId} />
      </td>
      <td className="py-3 pr-4 text-center text-[#7A8699]">→</td>
      <td className="py-3 pr-4">
        <div className="font-medium">{row.confidential.symbol}</div>
        <div className="text-xs text-[#7A8699]">{row.confidential.name}</div>
        <AddressLink address={row.confidentialTokenAddress} chainId={row.chainId} />
      </td>
      <td className="py-3 pr-4 text-right tabular-nums text-[#94A2B8]">{row.underlying.decimals}</td>
      <td className="py-3 text-right">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ring-1 ${
            row.source === "custom"
              ? "bg-[#FFC83D]/10 text-[#FFC83D] ring-[#FFC83D]/30"
              : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"
          }`}
        >
          {row.source}
        </span>
      </td>
    </tr>
  );
}

function RegistryInner() {
  const { rows, coverage, chainId, isLoading, isError, error, refetch } = useRegistryPairs();

  return (
    <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Registry</h2>
          {!isLoading && !isError && (
            <CoverageBadge total={coverage.total} onchain={coverage.onchain} custom={coverage.custom} />
          )}
        </div>
        <NetworkToggle />
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
          <p>Couldn&apos;t load the registry for chain {chainId}.</p>
          {error?.message && <p className="mt-1 text-xs text-rose-300/70">{error.message}</p>}
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-md bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-400/20"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="mt-6 text-sm text-[#7A8699]">
          No pairs found for this network. Add one in <code className="text-[#94A2B8]">config/pairs.ts</code>.
        </p>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-[#7A8699]">
                <th className="pb-2 pr-4 font-medium">ERC-20</th>
                <th className="pb-2 pr-4" />
                <th className="pb-2 pr-4 font-medium">ERC-7984</th>
                <th className="pb-2 pr-4 text-right font-medium">Decimals</th>
                <th className="pb-2 text-right font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <PairRow key={`${row.confidentialTokenAddress}-${row.source}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * Post-mount gate: `useListPairs` needs the ZamaProvider context, which only
 * mounts after hydration. Rendering the inner table on the first client paint
 * would call the hook outside the provider. The skeleton flips to the table in
 * the same commit the provider mounts.
 */
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
