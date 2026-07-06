"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { mainnet, sepolia } from "wagmi/chains";
import {
  GlassCard,
  SectionHeading,
  AnimatedCounter,
  cx,
} from "@/components/landing/primitives";
import { REGISTRY_ADDRESSES } from "@/config/pairs";

/* ------------------------------------------------------------------ *
 * InfrastructureGlobe — dark "FHE infrastructure" section. A rotating
 * point-cloud globe (Three.js, client-only + lazily mounted) sits at the
 * centre of a stage, ringed by protocol pills and flanked by the
 * plaintext → encrypted flow. A floating cToken ticket and a network
 * toggle complete the picture.
 *
 * SSR safety: the R3F <Canvas> never renders on the server. It is
 * dynamically imported with { ssr: false } AND only mounted once the
 * section scrolls into view. If the user prefers reduced motion we show
 * a static dotted-circle CSS fallback instead of the canvas.
 * ------------------------------------------------------------------ */

const GlobeSkeleton = () => (
  <div className="absolute inset-0 grid place-items-center">
    <div className="h-72 w-72 animate-pulse rounded-full bg-[radial-gradient(circle,rgba(181,214,255,0.12),transparent_70%)]" />
  </div>
);

/* Lazily-loaded canvas — ssr:false keeps `window` off the server. */
const GlobeCanvas = dynamic(
  () => import("./three/GlobeCanvas").then((m) => m.GlobeCanvas),
  { ssr: false, loading: () => <GlobeSkeleton /> }
);

/* Static fallback for prefers-reduced-motion: a dotted radial circle. */
function StaticGlobe() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div
        className="h-72 w-72 rounded-full opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(rgba(181,214,255,0.55) 1px, transparent 1.4px)",
          backgroundSize: "14px 14px",
          maskImage:
            "radial-gradient(circle at center, #000 55%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, #000 55%, transparent 72%)",
        }}
      />
    </div>
  );
}

/* Orbit rail pills positioned around the globe (top, bottom, left,
 * right + two diagonals). */
const RAIL = [
  { label: "ERC-20", pos: "left-1/2 top-0 -translate-x-1/2" },
  { label: "Zama KMS", pos: "right-6 top-[18%]" },
  { label: "EIP-712", pos: "right-2 top-1/2 -translate-y-1/2" },
  { label: "Relayer", pos: "right-6 bottom-[18%]" },
  { label: "ERC-7984", pos: "left-1/2 bottom-0 -translate-x-1/2" },
] as const;

/* Tiny inline chain glyphs for the network toggle — currentColor so they
 * inherit the button's active/inactive text color, no image asset. */
function ChainIcon({ network }: { network: Network }) {
  if (network === "Sepolia") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-3 w-3 shrink-0"
        fill="currentColor"
      >
        <path d="M8 0.5 3 8l5 3 5-3-5-7.5Z" opacity="0.6" />
        <path d="M8 12.2 3 9.2 8 15.5l5-6.3-5 3Z" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3 shrink-0"
      fill="currentColor"
    >
      <path d="M8 0 2 8.3 8 11.5l6-3.2L8 0Z" opacity="0.6" />
      <path d="M8 12.6 2 9.3 8 16l6-6.7-6 3.3Z" />
    </svg>
  );
}

const PILL_CLS =
  "absolute ring-1 ring-white/15 bg-white/5 px-3 py-1 rounded-pill font-mono text-xs text-[#B5D6FF] backdrop-blur-sm";

type Network = "Sepolia" | "Ethereum";

/** 0x1234…abcd */
function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function InfrastructureGlobe() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [network, setNetwork] = useState<Network>("Sepolia");

  // Honour prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Mount the heavy canvas only when the stage is in view.
  useEffect(() => {
    const el = stageRef.current;
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
      id="infrastructure"
      className="relative overflow-hidden bg-bg-dark py-24 text-foreground"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          tone="dark"
          align="center"
          title={
            <>
              <span className="text-accent-blue">FHE</span>-Powered Confidential
              Infrastructure
            </>
          }
          subtitle="Plaintext in, encrypted on-chain, decrypted only by you."
        />

        {/* Network toggle — sits above the globe so it never overlaps the
            orbit rail pills. */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-pill bg-white/5 p-1 ring-1 ring-white/15 backdrop-blur-sm">
            {(["Sepolia", "Ethereum"] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNetwork(n)}
                className={cx(
                  "flex items-center gap-1.5 rounded-pill px-4 py-1.5 font-mono text-xs transition-colors",
                  network === n
                    ? "bg-accent-blue text-accent-blue-foreground"
                    : "text-[#B5D6FF] hover:text-foreground"
                )}
              >
                <ChainIcon network={n} />
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Stage */}
        <div
          ref={stageRef}
          className="relative mx-auto mt-8 h-[520px] max-w-4xl"
        >
          {/* Globe (or fallbacks). */}
          <div className="absolute inset-0 z-0">
            {reduced ? <StaticGlobe /> : inView ? <GlobeCanvas /> : <GlobeSkeleton />}
          </div>

          {/* Soft glow behind the globe. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,107,228,0.18),transparent_65%)]"
          />

          {/* Non-interactive overlays. */}
          <div className="pointer-events-none absolute inset-0 z-30">
            {/* Orbiting rail pills. */}
            {RAIL.map((r) => (
              <span key={r.label} className={cx(PILL_CLS, r.pos)}>
                {r.label}
              </span>
            ))}

            {/* Flanking flow labels — hidden on mobile, stage has no room
                for edge labels without overlapping the rail pills/ticket. */}
            <span className="absolute left-2 top-1/2 hidden -translate-y-1/2 font-mono text-sm text-[#94A2B8] sm:block">
              Plaintext →
            </span>
            <span className="absolute right-2 bottom-[42%] hidden font-mono text-sm text-[#94A2B8] sm:block">
              ← Encrypted
            </span>

            {/* Center floating ticket chip. Reflects the selected network. */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float">
              <GlassCard tone="glass" className="px-6 py-5 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
                  cToken
                </p>
                <AnimatedCounter
                  value={356.76}
                  decimals={2}
                  prefix="$"
                  className="mt-1 block font-display text-3xl font-bold text-fg-dark"
                />
                <p className="mt-1 font-mono text-lg tracking-widest text-text-muted">
                  ••••••
                </p>
                <p className="mt-3 border-t border-black/10 pt-2 font-mono text-[11px] font-semibold text-fg-dark">
                  {network === "Sepolia" ? "Sepolia testnet" : "Ethereum Mainnet"}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                  {shortAddr(REGISTRY_ADDRESSES[network === "Sepolia" ? sepolia.id : mainnet.id])}
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
