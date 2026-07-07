"use client";

import { useMemo, useState } from "react";
import { cx } from "@/components/landing/primitives";
import { TokenIcon } from "./TokenIcon";
import type { RegistryRow } from "@/lib/registry";

/* ------------------------------------------------------------------ *
 * TokenSelect — Uniswap-style token picker that replaces the plain
 * <select> in the action panels. Same semantics: `value` is the
 * selected confidential-token address, `onChange(addr)` mirrors the old
 * `setSelectedConf(e.target.value)`.
 *
 * - Trigger pill: token coin + symbol + chevron.
 * - Hover the trigger → a popover of quick-pick registry suggestions
 *   (this-chain validRows), no click needed.
 * - Click the trigger → full searchable token modal.
 * ------------------------------------------------------------------ */

function symbolFor(row: RegistryRow, variant: "underlying" | "confidential") {
  return variant === "underlying" ? row.underlying.symbol : row.confidential.symbol;
}

export function TokenSelect({
  rows,
  value,
  onChange,
  variant = "confidential",
}: {
  rows: RegistryRow[];
  value: string;
  onChange: (confidentialAddress: string) => void;
  /** Which side's symbol/coin the trigger shows. */
  variant?: "underlying" | "confidential";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = useMemo(
    () => rows.find((r) => r.confidentialTokenAddress === value) ?? rows[0],
    [rows, value],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.underlying.symbol.toLowerCase().includes(needle) ||
        r.confidential.symbol.toLowerCase().includes(needle) ||
        r.confidentialTokenAddress.toLowerCase().includes(needle) ||
        r.erc20Address.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  if (!selected) return null;

  const pick = (addr: string) => {
    onChange(addr);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="group/select relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-pill bg-white/8 py-1.5 pl-1.5 pr-3 ring-1 ring-white/12 transition-colors hover:bg-white/12"
      >
        <TokenIcon symbol={symbolFor(selected, variant)} size={26} />
        <span className="font-display text-sm font-semibold">{symbolFor(selected, variant)}</span>
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-white/60" fill="none">
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Full modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-card border border-white/10 bg-[#17131E] shadow-float">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <p className="font-display font-semibold">Select a token</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-white/60 ring-1 ring-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-3">
              <input
                autoFocus
                spellCheck={false}
                placeholder="Search name or paste address"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0E0B13] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-blue/60"
              />
            </div>
            <div className="max-h-72 overflow-y-auto px-2 pb-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[#7A8699]">No tokens match.</p>
              ) : (
                filtered.map((r) => (
                  <button
                    key={r.confidentialTokenAddress}
                    type="button"
                    onClick={() => pick(r.confidentialTokenAddress)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/8",
                      r.confidentialTokenAddress === value && "bg-white/5",
                    )}
                  >
                    <TokenIcon symbol={symbolFor(r, variant)} size={30} />
                    <span className="min-w-0">
                      <span className="block font-display text-sm font-semibold">{symbolFor(r, variant)}</span>
                      <span className="block font-mono text-[11px] text-[#7A8699]">
                        {r.underlying.symbol} ↔ {r.confidential.symbol}
                        {!r.isValid && " · deprecated"}
                      </span>
                    </span>
                    {r.confidentialTokenAddress === value && (
                      <span className="ml-auto text-accent-blue">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
