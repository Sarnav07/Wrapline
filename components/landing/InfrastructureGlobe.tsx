"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  GlassCard,
  SectionHeading,
  AnimatedCounter,
  cx,
} from "@/components/landing/primitives";

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
  { label: "EIP-712", pos: "right-0 top-1/2 -translate-y-1/2" },
  { label: "Relayer", pos: "right-6 bottom-[18%]" },
  { label: "ERC-7984", pos: "left-1/2 bottom-0 -translate-x-1/2" },
] as const;

const PILL_CLS =
  "absolute ring-1 ring-white/15 bg-white/5 px-3 py-1 rounded-pill font-mono text-xs text-[#B5D6FF] backdrop-blur-sm";

type Network = "Sepolia" | "Ethereum";

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

        {/* Stage */}
        <div
          ref={stageRef}
          className="relative mx-auto mt-14 h-[520px] max-w-4xl"
        >
          {/* Network toggle — the one interactive overlay. */}
          <div className="pointer-events-auto absolute left-1/2 top-2 z-30 -translate-x-1/2">
            <div className="inline-flex rounded-pill bg-white/5 p-1 ring-1 ring-white/15 backdrop-blur-sm">
              {(["Sepolia", "Ethereum"] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNetwork(n)}
                  className={cx(
                    "rounded-pill px-4 py-1.5 font-mono text-xs transition-colors",
                    network === n
                      ? "bg-accent-blue text-accent-blue-foreground"
                      : "text-[#94A2B8] hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Globe (or fallbacks). */}
          <div className="absolute inset-0">
            {reduced ? <StaticGlobe /> : inView ? <GlobeCanvas /> : <GlobeSkeleton />}
          </div>

          {/* Soft glow behind the globe. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,107,228,0.18),transparent_65%)]"
          />

          {/* Non-interactive overlays. */}
          <div className="pointer-events-none absolute inset-0">
            {/* Orbiting rail pills. */}
            {RAIL.map((r) => (
              <span key={r.label} className={cx(PILL_CLS, r.pos)}>
                {r.label}
              </span>
            ))}

            {/* Flanking flow labels. */}
            <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-sm text-[#94A2B8]">
              Plaintext →
            </span>
            <span className="absolute right-0 bottom-[42%] font-mono text-sm text-[#94A2B8]">
              ← Encrypted
            </span>

            {/* Center floating ticket chip. */}
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
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
