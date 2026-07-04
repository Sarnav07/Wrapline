"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  PillButton,
  GlassCard,
  SectionHeading,
  Reveal,
  AnimatedCounter,
  cx,
} from "@/components/landing/primitives";

/* Lazily-loaded point-cloud globe (client-only, ssr:false keeps `window`
 * off the server). Rendered faint + accent-blue as a section backdrop. */
const GlobeCanvas = dynamic(
  () => import("./three/GlobeCanvas").then((m) => m.GlobeCanvas),
  { ssr: false }
);

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
    anim: "md:animate-float-1",
  },
  {
    key: "wrap",
    delay: "0.8s",
    pos: "md:absolute md:right-2 md:top-0 md:w-[340px] md:z-20",
    anim: "md:animate-float-2",
  },
  {
    key: "signature",
    delay: "1.6s",
    pos: "md:absolute md:left-[24%] md:bottom-6 md:w-[280px] md:z-40",
    anim: "md:animate-float-3",
  },
  {
    key: "pairs",
    delay: "2.4s",
    pos: "md:absolute md:right-[6%] md:bottom-2 md:w-[260px] md:z-10",
    anim: "md:animate-float-4",
  },
] as const;

export function TransparentPlatform() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Honour prefers-reduced-motion — skip the WebGL backdrop entirely.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Mount the heavy canvas only when the section scrolls into view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="platform"
      className="relative overflow-hidden bg-bg-light text-fg-dark py-24 sm:py-32"
    >
      {/* Rotating globe backdrop — faint accent-blue on white, edges masked. */}
      {!reduced && inView && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-70"
          style={{
            maskImage:
              "radial-gradient(circle at center, #000 45%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, #000 45%, transparent 72%)",
          }}
        >
          <GlobeCanvas color="#006be4" opacity={0.5} />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
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
          <div className="relative grid gap-4 md:block md:h-[460px] md:[perspective:1400px]">
            {CARDS.map(({ key, delay, pos, anim }) => (
              <div
                key={key}
                className={cx(anim, pos)}
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
