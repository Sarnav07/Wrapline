"use client";

import { useState } from "react";
import {
  PillButton,
  GlassCard,
  SectionHeading,
  Reveal,
  cx,
} from "@/components/landing/primitives";

/* ------------------------------------------------------------------ *
 * FullyUnderControl — light "you hold the keys" section. A centered
 * Fluxo-style pill tab group toggles between wrap / unwrap, which
 * subtly re-labels the first UI-snippet card. Three interactive glass
 * cards demo the core privacy primitives: reveal an encrypted balance,
 * sign an EIP-712 user-decryption, and browse the official registry.
 * ------------------------------------------------------------------ */

type Mode = "wrap" | "unwrap";

const REGISTRY_ROWS = [
  { underlying: "USDC", confidential: "cUSDC" },
  { underlying: "WETH", confidential: "cWETH" },
  { underlying: "DAI", confidential: "cDAI" },
] as const;

export function FullyUnderControl() {
  const [mode, setMode] = useState<Mode>("wrap");

  return (
    <section className="bg-bg-light py-24 text-fg-dark sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            tone="light"
            align="center"
            title={
              <>
                Your balances, fully under{" "}
                <span className="text-accent-blue">control</span>
              </>
            }
            subtitle="Reveal, wrap, and audit — on your terms, all from one place."
          />
        </Reveal>

        {/* Fluxo tab pills — controls the verb shown in the first card. */}
        <Reveal delay={80} className="mt-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Flow direction"
            className="inline-flex items-center gap-1.5 rounded-pill bg-white p-1.5 shadow-glass-light ring-1 ring-black/[0.06]"
          >
            {(["wrap", "unwrap"] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setMode(m)}
                  className={cx(
                    "rounded-pill px-5 py-2 text-sm font-medium capitalize tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60",
                    active
                      ? "bg-accent-blue text-white shadow-float-blue"
                      : "text-text-muted ring-1 ring-black/10 hover:text-fg-dark"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Three interactive UI-snippet cards. */}
        <div className="mt-12 grid gap-6 md:grid-cols-3 sm:mt-14">
          <Reveal delay={120}>
            <EncryptedBalanceCard mode={mode} />
          </Reveal>
          <Reveal delay={200}>
            <DecryptOnDemandCard />
          </Reveal>
          <Reveal delay={280}>
            <RegistryCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* 1 — Encrypted balances. Masked handle swaps to a mono number on Reveal.
 * The card title verb tracks the active tab (wrap → "Wrap balance"). */
function EncryptedBalanceCard({ mode }: { mode: Mode }) {
  const [revealed, setRevealed] = useState(false);
  const verb = mode === "wrap" ? "Wrap" : "Unwrap";

  return (
    <GlassCard tone="light" className="flex flex-col p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
        {verb} balance
      </p>
      <h3 className="mt-1.5 font-display text-lg font-bold tracking-tight text-fg-dark">
        Encrypted balances
      </h3>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-card bg-surface-gray/60 px-4 py-3.5 ring-1 ring-black/[0.04]">
        <span className="font-mono text-sm font-semibold text-fg-dark">
          cUSDC
        </span>
        <span
          className={cx(
            "font-mono text-lg tabular-nums text-fg-dark transition-all duration-300",
            revealed ? "tracking-tight" : "tracking-widest"
          )}
        >
          {revealed ? "1,250.00" : "••••••"}
        </span>
      </div>

      <div className="mt-5">
        <PillButton
          size="sm"
          variant={revealed ? "outline" : "primary"}
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? "Hide" : "Reveal"}
        </PillButton>
      </div>

      <p className="mt-auto pt-5 text-sm text-text-muted">
        Only you can decrypt.
      </p>
    </GlassCard>
  );
}

/* 2 — Decrypt on demand. EIP-712 "Sign to reveal" → cached chip. */
function DecryptOnDemandCard() {
  const [signed, setSigned] = useState(false);

  return (
    <GlassCard tone="light" className="flex flex-col p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
        EIP-712
      </p>
      <h3 className="mt-1.5 font-display text-lg font-bold tracking-tight text-fg-dark">
        Decrypt on demand
      </h3>

      <div className="mt-5 flex min-h-[68px] items-center rounded-card bg-surface-gray/60 px-4 py-3.5 ring-1 ring-black/[0.04]">
        {signed ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-600 ring-1 ring-emerald-500/20">
            <span aria-hidden>✓</span> Signature cached
          </span>
        ) : (
          <span className="font-mono text-xs text-text-muted">
            user-decryption · awaiting signature
          </span>
        )}
      </div>

      <div className="mt-5">
        <PillButton
          size="sm"
          variant={signed ? "outline" : "primary"}
          onClick={() => setSigned((v) => !v)}
        >
          {signed ? "Clear session" : "Sign to reveal"}
        </PillButton>
      </div>

      <p className="mt-auto pt-5 text-sm text-text-muted">
        One signature per session.
      </p>
    </GlassCard>
  );
}

/* 3 — Official pair registry. Mini mono table + pair-count badge. */
function RegistryCard() {
  return (
    <GlassCard tone="light" className="flex flex-col p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">
            Registry
          </p>
          <h3 className="mt-1.5 font-display text-lg font-bold tracking-tight text-fg-dark">
            Official pair registry
          </h3>
        </div>
        <span className="shrink-0 rounded-pill bg-accent-blue/10 px-3 py-1 font-mono text-xs font-semibold text-accent-blue">
          24 pairs
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-card bg-surface-gray/60 ring-1 ring-black/[0.04]">
        <div className="grid grid-cols-2 gap-3 border-b border-black/[0.06] px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
          <span>Underlying</span>
          <span className="text-right">Confidential</span>
        </div>
        {REGISTRY_ROWS.map((row, i) => (
          <div
            key={row.confidential}
            className={cx(
              "grid grid-cols-2 gap-3 px-4 py-2.5 font-mono text-sm text-fg-dark",
              i !== REGISTRY_ROWS.length - 1 && "border-b border-black/[0.04]"
            )}
          >
            <span>{row.underlying}</span>
            <span className="text-right text-accent-blue">
              {row.confidential}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-auto pt-5 text-sm text-text-muted">Onchain + curated.</p>
    </GlassCard>
  );
}
