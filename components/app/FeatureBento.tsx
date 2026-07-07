"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  GlassCard,
  SectionHeading,
  Reveal,
  AnimatedCounter,
  cx,
} from "@/components/landing/primitives";
import { CoinDisc } from "./TokenIcon";
import { useAllChainsPairs } from "@/lib/registry";

/* ------------------------------------------------------------------ *
 * FeatureBento — a Uniswap-style 2x2 feature bento below the action
 * console, adapted to Wrapline. Every tile is original Wrapline content
 * (confidential FHE wrapping, registry, dual-chain, developer flow);
 * one tile carries a live coin cluster, one carries the point-cloud
 * globe. Reuses GlassCard / SectionHeading / Reveal / AnimatedCounter
 * from the landing primitives and CoinDisc from the token field.
 * ------------------------------------------------------------------ */

const GlobeSkeleton = () => (
  <div className="absolute inset-0 grid place-items-center">
    <div className="h-40 w-40 animate-pulse rounded-full bg-[radial-gradient(circle,rgba(255,121,207,0.16),transparent_70%)]" />
  </div>
);

// Lazy, client-only R3F canvas (keeps `window` off the server).
const GlobeCanvas = dynamic(
  () => import("@/components/landing/three/GlobeCanvas").then((m) => m.GlobeCanvas),
  { ssr: false, loading: () => <GlobeSkeleton /> },
);

/** True when the user asked the OS to reduce motion. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Static dotted circle shown instead of the spinning globe under reduced-motion. */
function StaticGlobe() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div
        className="h-40 w-40 rounded-full opacity-70"
        style={{
          backgroundImage: "radial-gradient(rgba(255,121,207,0.6) 1px, transparent 1.4px)",
          backgroundSize: "12px 12px",
          maskImage: "radial-gradient(circle at center, #000 55%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at center, #000 55%, transparent 72%)",
        }}
      />
    </div>
  );
}

/** Small colored eyebrow: a tinted chip glyph + label, like the reference tiles. */
function Eyebrow({ color, label }: { color: string; label: string }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color }}>
      <span className="grid h-5 w-5 place-items-center rounded-md" style={{ background: `${color}22` }}>
        <span className="h-2 w-2 rounded-[3px]" style={{ background: color }} />
      </span>
      {label}
    </p>
  );
}

const CLUSTER = ["USDCMock", "WETHMock", "ZAMAMock", "tGBP", "XAUtMock"];

export function FeatureBento() {
  const { rows } = useAllChainsPairs();
  const reduced = usePrefersReducedMotion();

  // Honest live count: valid pairs across both chains; never below the 8
  // hardcoded CUSTOM_PAIRS so the counter is never blank pre-connect.
  const liveValid = rows.filter((r) => r.isValid).length;
  const pairCount = Math.max(liveValid, 8);

  const tileBase =
    "relative flex min-h-[220px] flex-col overflow-hidden rounded-card p-6 sm:p-7";

  return (
    <div>
      <SectionHeading
        tone="dark"
        eyebrow="Built for confidential value"
        title="Everything the wrapper needs, on-chain."
        subtitle="Wrap public ERC-20s into encrypted ERC-7984 balances, browse the registry, and reveal only what you choose. No bridge, no custodian."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* 1. Confidential by default */}
        <Reveal>
          <GlassCard
            tone="dark"
            className={cx(tileBase, "bg-[radial-gradient(120%_120%_at_0%_0%,rgba(245,55,165,0.16),transparent_55%)]")}
          >
            <Eyebrow color="#f75fb5" label="Confidential" />
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#ffa8dc]">
              Encrypted by default.
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#94A2B8]">
              ERC-7984 balances are FHE-encrypted on-chain. Only the holder reveals a balance, through an
              EIP-712 signature the SDK caches for the session.
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {["End-to-end FHE", "EIP-712 reveal", "No plaintext"].map((b) => (
                <span
                  key={b}
                  className="rounded-pill bg-white/5 px-3 py-1.5 text-xs font-medium text-[#c9d6e8] ring-1 ring-white/10"
                >
                  {b}
                </span>
              ))}
            </div>
          </GlassCard>
        </Reveal>

        {/* 2. Registry-backed (live coin cluster + count) */}
        <Reveal delay={80}>
          <GlassCard
            tone="dark"
            className={cx(tileBase, "bg-[radial-gradient(120%_120%_at_100%_0%,rgba(16,185,129,0.16),transparent_55%)]")}
          >
            <Eyebrow color="#34d399" label="Registry" />
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#6ee7b7]">
              <AnimatedCounter value={pairCount} /> confidential pairs.
            </h3>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-[#94A2B8]">
              One registry of ERC-20 to ERC-7984 wrappers across Sepolia and Ethereum Mainnet.
            </p>
            <a
              href="#registry"
              className="mt-auto inline-flex w-fit items-center gap-2 rounded-pill bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              View registry
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                <path d="M4 8h8M9 4l3 4-3 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            {/* Coin cluster, echoing the reference liquidity tile */}
            <div aria-hidden className="pointer-events-none absolute -right-2 top-6 h-40 w-40">
              {CLUSTER.map((sym, i) => {
                const pos = [
                  { r: 96, t: 6, s: 44 },
                  { r: 22, t: 30, s: 56 },
                  { r: 70, t: 62, s: 40 },
                  { r: 8, t: 92, s: 34 },
                  { r: 120, t: 74, s: 30 },
                ][i];
                return (
                  <span
                    key={sym}
                    className="absolute animate-float-1"
                    style={{ right: pos.r, top: pos.t, animationDelay: `${i * 0.4}s`, opacity: 0.9 }}
                  >
                    <CoinDisc symbol={sym} size={pos.s} />
                  </span>
                );
              })}
            </div>
          </GlassCard>
        </Reveal>

        {/* 3. Developer-ready */}
        <Reveal delay={120}>
          <GlassCard
            tone="dark"
            className={cx(tileBase, "bg-[radial-gradient(120%_120%_at_0%_100%,rgba(249,115,22,0.15),transparent_55%)]")}
          >
            <Eyebrow color="#fb923c" label="Developer" />
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#fdba74]">
              Register a pair in one script.
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#94A2B8]">
              Built on the Zama FHE Relayer SDK. Point the script at any ERC-20 and its wrapper to add it to
              the on-chain registry.
            </p>
            <div className="mt-auto pt-5">
              <code className="inline-block rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-[#fdba74] ring-1 ring-white/10">
                bash scripts/register-pair.sh
              </code>
            </div>
          </GlassCard>
        </Reveal>

        {/* 4. Dual-chain (globe) */}
        <Reveal delay={160}>
          <GlassCard
            tone="dark"
            className={cx(tileBase, "bg-[radial-gradient(120%_120%_at_100%_100%,rgba(255,121,207,0.18),transparent_55%)]")}
          >
            <Eyebrow color="#818cf8" label="Dual-chain" />
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#c7b3ff]">
              One registry, two networks.
            </h3>
            <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-[#94A2B8]">
              Live on Sepolia today and ready for Ethereum Mainnet, read from a single interface.
            </p>

            <div className="pointer-events-none absolute -bottom-8 -right-6 h-48 w-48">
              {reduced ? <StaticGlobe /> : <GlobeCanvas color="#818cf8" opacity={0.85} />}
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}
