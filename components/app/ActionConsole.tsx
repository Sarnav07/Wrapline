"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/landing/primitives";
import { WrapPanel } from "@/components/WrapCard";
import { UnwrapPanel } from "@/components/UnwrapCard";
import { DecryptPanel } from "@/components/DecryptCard";

/* ------------------------------------------------------------------ *
 * ActionConsole — the Uniswap-style swap card. A segmented Wrap /
 * Unwrap / Decrypt tab header over one of the three action panels.
 * Owns the single post-mount gate so the SDK hooks inside the panels
 * only run once mounted inside the ZamaProvider context.
 * ------------------------------------------------------------------ */

const TABS = [
  { key: "wrap", label: "Wrap" },
  { key: "unwrap", label: "Unwrap" },
  { key: "decrypt", label: "Decrypt" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ActionConsole() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabKey>("wrap");
  useEffect(() => setReady(true), []);

  return (
    <div className="mx-auto w-full max-w-[640px] animate-fade-up rounded-card border border-white/10 bg-[#17131E] p-4 shadow-float sm:p-5">
      {/* Tab header */}
      <div className="flex gap-1 rounded-pill bg-black/30 p-1 ring-1 ring-white/8">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cx(
              "flex-1 rounded-pill px-3 py-2 text-sm font-semibold transition-colors",
              tab === t.key
                ? "bg-accent-blue text-accent-blue-foreground shadow-float-blue"
                : "text-[#94A2B8] hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="mt-3">
        {!ready ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        ) : tab === "wrap" ? (
          <WrapPanel />
        ) : tab === "unwrap" ? (
          <UnwrapPanel />
        ) : (
          <DecryptPanel />
        )}
      </div>
    </div>
  );
}
