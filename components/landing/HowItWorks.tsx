import {
  GlassCard,
  PillButton,
  Reveal,
  SectionHeading,
} from "@/components/landing/primitives";

/* ------------------------------------------------------------------ *
 * HowItWorks — light section. A 4-step wrapping rail (row on lg with
 * thin connector lines, stacked on mobile) plus a centered glass
 * confirmation card. The four real cWrapline steps.
 * ------------------------------------------------------------------ */
const STEPS = [
  {
    title: "Approve",
    caption: "Grant the wrapper an allowance for your ERC-20.",
  },
  {
    title: "Wrap",
    caption: "Deposit the ERC-20 and mint its confidential ERC-7984 twin.",
  },
  {
    title: "Shielded",
    caption: "Your balance is encrypted on-chain; only you can read it.",
  },
  {
    title: "Unwrap",
    caption: "Burn the confidential token to redeem the underlying ERC-20.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-bg-light py-24 text-fg-dark sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal delay={0}>
          <SectionHeading
            tone="light"
            align="center"
            title={
              <>
                How <span className="text-accent-blue">wrapping</span> works
              </>
            }
            subtitle="Four on-chain steps. No intermediaries."
          />
        </Reveal>

        {/* The 4-step rail. */}
        <Reveal delay={120} className="mt-16">
          <ol className="grid gap-12 lg:grid-cols-4 lg:gap-0">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative flex flex-col items-center text-center lg:px-6"
              >
                {/* Thin connector line to the next step (lg only). */}
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-6 hidden h-px w-full bg-black/10 lg:block"
                  />
                )}

                {/* Blue circular number badge. */}
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue font-mono text-base font-semibold text-white shadow-float-blue">
                  {i + 1}
                </span>

                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-text-muted">
                  {step.caption}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* Confirmation card. */}
        <Reveal delay={240} className="mt-16 flex justify-center">
          <GlassCard
            tone="light"
            className="w-full max-w-md p-7 shadow-float sm:p-8"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-base text-emerald-500">
                ✓
              </span>
              <p className="font-display text-lg font-semibold tracking-tight">
                Your wrap is confirmed
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-pill bg-surface-gray/60 px-5 py-3">
              <span className="text-sm text-text-muted">Encrypted handle</span>
              <span className="font-mono text-sm font-medium text-fg-dark">
                0x9f3c…a21b
              </span>
            </div>

            <PillButton href="/app" variant="primary" className="mt-6 w-full">
              Open the app
            </PillButton>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
