import {
  GlassCard,
  Reveal,
  SectionHeading,
} from "@/components/landing/primitives";
import { Monogram } from "@/components/landing/Monogram";

/* ------------------------------------------------------------------ *
 * FeatureCards — light section ("Why Wrapline"). A 3-card row, each
 * with a distinct visual on top of a title + one-line caption. The
 * three pillars of cWrapline: shielded balances, FHE-not-custody, and
 * the official pair registry.
 * ------------------------------------------------------------------ */

/* Registry snippet used in card 3 — real ERC-20 ↔ ERC-7984 pairs. */
const PAIRS = [
  { from: "USDC", to: "cUSDC" },
  { from: "WETH", to: "cWETH" },
  { from: "DAI", to: "cDAI" },
] as const;

export function FeatureCards() {
  return (
    <section id="features" className="bg-bg-light py-24 text-fg-dark sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal delay={0}>
          <SectionHeading
            eyebrow="Why Wrapline"
            tone="light"
            align="left"
            title={
              <>
                Confidentiality,{" "}
                <span className="text-accent-blue">built in</span>.
              </>
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {/* 1 — Shielded by default (blue card, white text). */}
          <Reveal delay={80}>
            <GlassCard
              tone="blue"
              className="flex min-h-[320px] flex-col overflow-hidden p-7"
            >
              <div className="relative flex flex-1 items-center justify-center">
                {/* Slowly rotating ring of "WRAP" segments. */}
                <div className="relative h-36 w-36">
                  <div className="absolute inset-0 animate-spin-slow">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute left-1/2 top-1/2 origin-[0_0] font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70"
                        style={{
                          transform: `rotate(${i * 45}deg) translateY(-4.25rem)`,
                        }}
                      >
                        WRAP
                      </span>
                    ))}
                  </div>
                  {/* Concentric rings + locked core. */}
                  <div className="absolute inset-3 rounded-full border border-white/25" />
                  <div className="absolute inset-7 rounded-full border border-dashed border-white/40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/40 backdrop-blur-sm">
                      <Monogram size={26} inherit className="text-white" />
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">
                Shielded by default
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Balances are encrypted on-chain with FHE — only the holder can
                decrypt them.
              </p>
            </GlassCard>
          </Reveal>

          {/* 2 — FHE, not custody (dark card, particle sphere). */}
          <Reveal delay={160}>
            <GlassCard
              tone="dark"
              className="flex min-h-[320px] flex-col overflow-hidden p-7"
            >
              <div className="relative flex flex-1 items-center justify-center">
                <div className="relative h-36 w-36">
                  {/* Radial glow. */}
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,107,228,0.45),transparent_68%)] blur-[2px]" />
                  {/* Dotted-sphere shells (CSS radial dot grids). */}
                  <div
                    className="absolute inset-0 rounded-full opacity-70 animate-float [background:radial-gradient(rgba(181,214,255,0.55)_1px,transparent_1.6px)] [background-size:11px_11px]"
                    style={{
                      WebkitMaskImage:
                        "radial-gradient(circle at center, #000 58%, transparent 72%)",
                      maskImage:
                        "radial-gradient(circle at center, #000 58%, transparent 72%)",
                    }}
                  />
                  <div className="absolute inset-4 rounded-full border border-white/10" />
                  <div className="absolute inset-10 rounded-full border border-accent-blue/30" />
                  {/* Centered monogram core. */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0E1424] ring-1 ring-white/15 shadow-float-blue">
                      <Monogram size={40} />
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground">
                FHE, not custody
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#94A2B8]">
                No bridge, no custodian. Confidentiality is enforced by the Zama
                protocol.
              </p>
            </GlassCard>
          </Reveal>

          {/* 3 — One registry, every pair (light card, mini table). */}
          <Reveal delay={240}>
            <GlassCard
              tone="light"
              className="flex min-h-[320px] flex-col p-7 ring-1 ring-black/5"
            >
              <div className="flex flex-1 items-center">
                <div className="w-full rounded-card bg-surface-gray/50 p-2">
                  {PAIRS.map((pair, i) => (
                    <div
                      key={pair.from}
                      className={[
                        "flex items-center justify-between px-4 py-3 font-mono text-sm",
                        i < PAIRS.length - 1 ? "border-b border-black/[0.07]" : "",
                      ].join(" ")}
                    >
                      <span className="text-fg-dark">{pair.from}</span>
                      <span className="text-accent-blue" aria-hidden>
                        →
                      </span>
                      <span className="font-medium text-accent-blue">
                        {pair.to}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
                One registry, every pair
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Wrap every official ERC-20 ↔ ERC-7984 pair on Sepolia and
                mainnet.
              </p>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
