"use client";

import {
  PillButton,
  GlassCard,
  SectionHeading,
  Reveal,
  AnimatedCounter,
  cx,
} from "@/components/landing/primitives";

/* ------------------------------------------------------------------ *
 * TransparentPlatform — light "transparent token layer" section.
 * Fluxo's signature look: a stage of floating, overlapping product-UI
 * glass cards. On md+ the cards are absolutely positioned at varied
 * offsets, each gently floating with a staggered delay and layered via
 * z-index. On small screens it collapses to a clean stacked grid.
 * ------------------------------------------------------------------ */

/* Each card is positioned on the md+ stage via these classes. On <md the
 * positioning classes are gated behind md: so the parent grid lays them
 * out in normal flow (static, no float). */
const CARDS = [
  {
    key: "balance",
    delay: "0s",
    pos: "md:absolute md:left-0 md:top-10 md:w-[300px] md:z-30",
  },
  {
    key: "wrap",
    delay: "0.8s",
    pos: "md:absolute md:right-2 md:top-0 md:w-[340px] md:z-20",
  },
  {
    key: "signature",
    delay: "1.6s",
    pos: "md:absolute md:left-[24%] md:bottom-6 md:w-[280px] md:z-40",
  },
  {
    key: "pairs",
    delay: "2.4s",
    pos: "md:absolute md:right-[6%] md:bottom-2 md:w-[260px] md:z-10",
  },
] as const;

export function TransparentPlatform() {
  return (
    <section
      id="platform"
      className="bg-bg-light text-fg-dark py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            tone="light"
            align="center"
            title={
              <>
                A confidential{" "}
                <span className="text-accent-blue">token layer</span>, built on
                public chains.
              </>
            }
            subtitle="Encrypted balances on-chain. Public verifiability. No bridge, no custodian."
          />
        </Reveal>

        {/* Stage: floating overlapping cards on md+, stacked grid on mobile */}
        <Reveal delay={120} className="mt-14 sm:mt-20">
          <div className="relative grid gap-4 md:block md:h-[460px]">
            {CARDS.map(({ key, delay, pos }) => (
              <div
                key={key}
                className={cx("md:animate-float", pos)}
                style={{ animationDelay: delay }}
              >
                {key === "balance" && <BalanceCard />}
                {key === "wrap" && <WrapCard />}
                {key === "signature" && <SignatureCard />}
                {key === "pairs" && <PairsCard />}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 1 — Encrypted balance (light). Masked value + Reveal pill. */
function BalanceCard() {
  return (
    <GlassCard tone="light" className="p-6">
      <p className="text-text-muted text-xs uppercase tracking-[0.18em]">
        Encrypted balance
      </p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="font-mono font-semibold text-fg-dark">cUSDC</span>
        <span className="font-mono tracking-widest text-2xl text-fg-dark">
          ••••••
        </span>
      </div>
      <div className="mt-5">
        <PillButton size="sm" variant="primary">
          Reveal
        </PillButton>
      </div>
    </GlassCard>
  );
}

/* 2 — Wrap (dark). ERC-20 -> ERC-7984 ticket. */
function WrapCard() {
  return (
    <GlassCard tone="dark" className="p-6">
      <p className="text-foreground text-sm font-semibold">Wrap</p>
      <div className="mt-4 flex items-center justify-between gap-3 font-mono text-sm">
        <span className="text-foreground">100.00 USDC</span>
        <span className="text-accent-blue text-lg">→</span>
        <span className="text-foreground">100.00 cUSDC</span>
      </div>
      <p className="mt-4 text-[#94A2B8] text-xs font-mono">
        ERC-20 → ERC-7984
      </p>
    </GlassCard>
  );
}

/* 3 — Signature verified (glass). EIP-712 user-decryption. */
function SignatureCard() {
  return (
    <GlassCard tone="glass" className="p-6">
      <p className="flex items-center gap-2 text-fg-dark font-semibold">
        <span className="text-accent-blue">✓</span>
        Signature verified
      </p>
      <p className="mt-2 text-text-muted text-xs font-mono">
        EIP-712 user-decryption
      </p>
    </GlassCard>
  );
}

/* 4 — Official pairs live (blue). Animated counter, white text. */
function PairsCard() {
  return (
    <GlassCard tone="blue" className="p-6 text-center">
      <AnimatedCounter
        value={24}
        suffix=""
        className="font-display text-5xl font-bold leading-none"
      />
      <p className="mt-3 text-sm font-medium text-accent-blue-foreground/90">
        official pairs live
      </p>
    </GlassCard>
  );
}
