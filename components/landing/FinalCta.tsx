import {
  PillButton,
  SectionHeading,
  Reveal,
} from "@/components/landing/primitives";
import { ParticleDome } from "@/components/landing/ParticleDome";

/* ------------------------------------------------------------------ *
 * FinalCta — closing dark call-to-action. A point-cloud dome rises from
 * the bottom edge while the headline and CTAs sit centered above it.
 * ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-bg-dark py-32 text-foreground">
      {/* Rising particle dome anchored to the bottom. */}
      <div className="absolute inset-x-0 bottom-0 h-[60%]">
        <ParticleDome />
      </div>

      {/* Content above the dome. */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            tone="dark"
            align="center"
            title={
              <>
                Wrap with <span className="text-accent-blue">confidence</span>.
              </>
            }
            subtitle="Connect a wallet, claim test tokens on Sepolia, and wrap your first confidential balance in minutes."
          />
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PillButton href="/app" variant="primary">
              Launch app →
            </PillButton>
            <PillButton
              href="https://github.com/Sarnav07/Wrapline"
              external
              variant="outline"
            >
              View on GitHub
            </PillButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
