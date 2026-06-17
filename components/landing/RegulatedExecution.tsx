import {
  GlassCard,
  PillButton,
  Reveal,
  SectionHeading,
} from "@/components/landing/primitives";

/* ------------------------------------------------------------------ *
 * RegulatedExecution — light section, two-column on lg. Left rail is
 * the verifiable-settlement pitch (heading + body + CTA to the
 * registry). Right rail is a dark visual card carrying an overlaid
 * glass "Unwrap finalized" confirmation chip with a mono tx hash.
 * ------------------------------------------------------------------ */
export function RegulatedExecution() {
  return (
    <section className="bg-bg-light py-24 text-fg-dark sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* LEFT — pitch + CTA. */}
          <Reveal>
            <SectionHeading
              tone="light"
              align="left"
              title={
                <>
                  Verifiable execution,{" "}
                  <span className="text-accent-blue">on-chain</span> settlement
                </>
              }
            />
            <p className="mt-5 text-lg leading-relaxed text-text-muted">
              Approve, wrap, and unwrap directly against the official Wrappers
              Registry. Every step is a real transaction you can verify on
              Etherscan — no bridge, no custodian, no off-chain trust.
            </p>
            <div className="mt-7">
              <PillButton href="/app" variant="primary">
                Browse the registry
              </PillButton>
            </div>
          </Reveal>

          {/* RIGHT — dark visual with overlaid confirmation chip. */}
          <Reveal delay={150}>
            <GlassCard
              tone="dark"
              className="relative flex min-h-[340px] items-center justify-center overflow-hidden p-8"
            >
              {/* Brand-gradient wash. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-brand opacity-20"
              />
              {/* Faint dotted texture. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              />

              {/* Centered glass confirmation chip. */}
              <GlassCard
                tone="glass"
                className="relative z-10 w-full max-w-xs p-5 text-center"
              >
                <p className="font-display text-xl font-bold tracking-tight text-fg-dark">
                  <span className="text-accent-blue">✓</span> Unwrap finalized
                </p>
                <p className="mt-1 text-sm text-text-muted">Completed</p>
                <p className="mt-4 font-mono text-xs text-text-muted">
                  0x4b2e…9c7f
                </p>
              </GlassCard>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
