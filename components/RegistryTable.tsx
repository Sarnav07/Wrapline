"use client";

import { useEffect, useMemo, useState } from "react";
import { mainnet, sepolia } from "wagmi/chains";
import type { Address } from "viem";
import { useAllChainsPairs, type RegistryRow } from "@/lib/registry";
import { GlassCard, Reveal } from "@/components/landing/primitives";

const INITIAL_VISIBLE = 6;

type NetworkFilter = "all" | "sepolia" | "mainnet";

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
      className="font-mono text-xs text-text-muted transition-colors hover:text-accent-blue"
    >
      {short(address)}
    </a>
  );
}

/* ---- segmented network filter (blue+white) ---- */

function NetworkFilterTabs({
  value,
  onChange,
  counts,
}: {
  value: NetworkFilter;
  onChange: (v: NetworkFilter) => void;
  counts: { all: number; sepolia: number; mainnet: number };
}) {
  const tabs: { key: NetworkFilter; label: string }[] = [
    { key: "all", label: `All ${counts.all}` },
    { key: "sepolia", label: `Sepolia ${counts.sepolia}` },
    { key: "mainnet", label: `Mainnet ${counts.mainnet}` },
  ];
  return (
    <div className="flex gap-1 rounded-pill bg-black/[0.04] p-1 ring-1 ring-black/5">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`rounded-pill px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            value === t.key
              ? "bg-accent-blue text-accent-blue-foreground shadow-float-blue"
              : "text-text-muted hover:text-fg-dark"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---- one pair card ---- */

function PairCard({ row }: { row: RegistryRow }) {
  const isMainnet = row.chainId === mainnet.id;
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] shadow-glass-light transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float-blue hover:ring-accent-blue/40${
        row.isValid ? "" : " opacity-60"
      }`}
    >
      {/* header: network + source */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-text-muted">
          <span className={`h-2 w-2 rounded-full ${isMainnet ? "bg-violet-500" : "bg-amber-500"}`} />
          {isMainnet ? "Mainnet" : "Sepolia"}
        </span>
        <span className="flex items-center gap-1.5">
          {!row.isValid && (
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 ring-1 ring-rose-500/20">
              deprecated
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
              row.source === "custom"
                ? "bg-accent-blue/10 text-accent-blue ring-accent-blue/25"
                : "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
            }`}
          >
            {row.source}
          </span>
        </span>
      </div>

      {/* symbols: ERC-20 → ERC-7984 */}
      <div>
        <div className="flex items-center gap-2 text-[15px] font-semibold text-fg-dark">
          <span className="truncate">{row.underlying.symbol}</span>
          <span className="shrink-0 text-accent-blue">→</span>
          <span className="truncate">{row.confidential.symbol}</span>
        </div>
        {/* full token name when it adds info beyond the symbol */}
        {row.underlying.name && row.underlying.name !== row.underlying.symbol && (
          <div className="mt-0.5 truncate text-xs text-text-muted">{row.underlying.name}</div>
        )}
      </div>

      {/* addresses + decimals */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
        <AddressLink address={row.erc20Address} chainId={row.chainId} />
        <span className="text-text-muted/50">·</span>
        <AddressLink address={row.confidentialTokenAddress} chainId={row.chainId} />
        <span className="text-text-muted/50">·</span>
        <span className="tabular-nums">{row.underlying.decimals} dec</span>
      </div>
    </div>
  );
}

/* ---- card skeleton for loading / pre-hydration ---- */

function SkeletonGrid() {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-black/[0.04]" />
      ))}
    </div>
  );
}

function RegistryShell({ children }: { children: React.ReactNode }) {
  return (
    <GlassCard tone="light" className="p-6 sm:p-7">
      {children}
    </GlassCard>
  );
}

function RegistryInner() {
  const { rows, isLoading, isError } = useAllChainsPairs();
  const [filter, setFilter] = useState<NetworkFilter>("all");
  const [expanded, setExpanded] = useState(false);

  const counts = useMemo(
    () => ({
      all: rows.length,
      sepolia: rows.filter((r) => r.chainId === sepolia.id).length,
      mainnet: rows.filter((r) => r.chainId === mainnet.id).length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    if (filter === "sepolia") return rows.filter((r) => r.chainId === sepolia.id);
    if (filter === "mainnet") return rows.filter((r) => r.chainId === mainnet.id);
    return rows;
  }, [rows, filter]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - visible.length;

  return (
    <RegistryShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-fg-dark">Registry</h2>
          {!isLoading && !isError && rows.length > 0 && (
            <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs text-text-muted ring-1 ring-black/5">
              {rows.length} {rows.length === 1 ? "pair" : "pairs"}
            </span>
          )}
        </div>
        {!isLoading && !isError && rows.length > 0 && (
          <NetworkFilterTabs
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setExpanded(false);
            }}
            counts={counts}
          />
        )}
      </div>

      {isLoading && <SkeletonGrid />}

      {isError && (
        <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-50 p-4 text-sm text-rose-600">
          <p>Couldn&apos;t load the registry. Check your connection and reload.</p>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className="mt-5 text-sm text-text-muted">
          No pairs found. Add one in <code className="text-fg-dark">config/pairs.ts</code>.
        </p>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          {/* key forces the grid to remount on filter/expand so Reveal replays */}
          <div key={`${filter}-${expanded}`} className="mt-5 grid gap-3 sm:grid-cols-2">
            {visible.map((row, i) => (
              <Reveal key={`${row.chainId}-${row.confidentialTokenAddress}`} delay={i * 40}>
                <PairCard row={row} />
              </Reveal>
            ))}
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-4 w-full rounded-pill bg-white py-2.5 text-sm font-semibold text-accent-blue ring-1 ring-accent-blue/25 shadow-glass-light transition-all hover:-translate-y-0.5 hover:ring-accent-blue/50"
            >
              Show all {filtered.length}
            </button>
          )}
          {expanded && filtered.length > INITIAL_VISIBLE && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mt-4 w-full rounded-pill py-2.5 text-sm font-semibold text-text-muted transition-colors hover:text-fg-dark"
            >
              Show less
            </button>
          )}
        </>
      )}
    </RegistryShell>
  );
}

/** Post-mount gate: avoids SSR mismatch before hydration completes. */
export function RegistryTable() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <RegistryShell>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-fg-dark">Registry</h2>
        </div>
        <SkeletonGrid />
      </RegistryShell>
    );
  }

  return <RegistryInner />;
}
