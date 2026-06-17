import { PillButton, Reveal } from "@/components/landing/primitives";
import { WrapRain } from "@/components/landing/WrapRain";

/* ------------------------------------------------------------------ *
 * Hero — the dark, full-height first view under the fixed nav.
 * Type-rain texture + a soft blue glow behind centered display copy.
 * ------------------------------------------------------------------ */
export function Hero() {
  return (
    <section
      id="home"
      className="relative grid min-h-screen place-items-center overflow-hidden bg-bg-dark px-5 pt-28 pb-24 text-foreground sm:px-8"
    >
      {/* Background layer 1 — the signature type-rain texture. */}
      <WrapRain tone="dark" />

      {/* Background layer 2 — soft diffuse blue glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-accent-blue/20 blur-[140px]"
      />

      {/* Centered content. */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <Reveal delay={0}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-blue">
            Confidential Wrapper Registry · Built on Zama FHE
          </p>
        </Reveal>

        <Reveal delay={90}>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Confidential <span className="text-accent-blue">wrapping</span>,
            without the friction.
          </h1>
        </Reveal>

        <Reveal delay={180}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#94A2B8]">
            Wrap any ERC-20 into a confidential ERC-7984 token, move shielded
            balances on-chain, and reveal them only when you choose — powered by
            Zama&apos;s fully homomorphic encryption.
          </p>
        </Reveal>

        <Reveal delay={270}>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <PillButton href="/app" variant="primary">
              Launch app →
            </PillButton>
            <PillButton
              href="https://docs.zama.ai"
              external
              variant="outline"
            >
              Read the docs
            </PillButton>
          </div>
        </Reveal>
      </div>

      {/* Scroll cue. */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-xs text-white/50">
        Scroll to explore
        <span className="animate-bob">↓</span>
      </div>
    </section>
  );
}
