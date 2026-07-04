"use client";

import { useState } from "react";
import {
  Reveal,
  SectionHeading,
  cx,
} from "@/components/landing/primitives";
import { WrapRain } from "@/components/landing/WrapRain";

/* ------------------------------------------------------------------ *
 * Faq — light section. Category pill tabs switch the visible Q&A set;
 * each set is an accordion (one row open at a time). A faint WrapRain
 * sits low-opacity on the right margin behind the content. The real
 * cWrapline copy: confidential wrapping, FHE decryption, networks,
 * custody.
 * ------------------------------------------------------------------ */

type QA = { q: string; a: string };

const CATEGORIES: { id: string; items: QA[] }[] = [
  {
    id: "General",
    items: [
      {
        q: "What is Wrapline?",
        a: "A UI for the official Confidential Wrappers Registry: wrap ERC-20s into confidential ERC-7984 tokens and back, on Sepolia and Ethereum.",
      },
      {
        q: "Who is it for?",
        a: "Anyone who wants on-chain balances that stay private by default, without giving up custody or verifiability.",
      },
    ],
  },
  {
    id: "Wrapping",
    items: [
      {
        q: "What is a confidential token?",
        a: "An ERC-7984 token whose balances are encrypted on-chain using Zama's FHE; only the holder can decrypt them.",
      },
      {
        q: "How do I wrap?",
        a: "Approve the wrapper, then wrap. The ERC-20 is deposited and its confidential twin is minted. Unwrapping reverses it.",
      },
    ],
  },
  {
    id: "Decryption",
    items: [
      {
        q: "How do I see my balance?",
        a: "Reveal it via EIP-712 user-decryption: one signature, then the session is cached.",
      },
      {
        q: "Can anyone else read my balance?",
        a: "No. Balances are encrypted on-chain; decryption requires your signature.",
      },
    ],
  },
  {
    id: "Networks",
    items: [
      {
        q: "Which networks are supported?",
        a: "Sepolia (with a test-token faucet) and Ethereum mainnet.",
      },
    ],
  },
  {
    id: "Security",
    items: [
      {
        q: "Is it custodial?",
        a: "No. Wrapping is a direct on-chain transaction; confidentiality is enforced by the protocol, not a third party.",
      },
    ],
  },
];

export function Faq() {
  const [active, setActive] = useState(0);
  const [openIndex, setOpenIndex] = useState(0);

  const items = CATEGORIES[active].items;

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-bg-light py-24 text-fg-dark sm:py-32"
    >
      {/* Faint type-rain on the right margin, behind content. */}
      <WrapRain
        tone="light"
        className="left-auto right-0 w-[28%] opacity-50"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal delay={0}>
          <SectionHeading
            tone="light"
            align="center"
            title={
              <>
                Frequently Asked{" "}
                <span className="text-accent-blue">Questions</span>
              </>
            }
            subtitle="Everything about confidential wrapping with Wrapline."
          />
        </Reveal>

        {/* Category pill tabs. */}
        <Reveal delay={120} className="mt-12">
          <div
            role="tablist"
            aria-label="FAQ categories"
            className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
          >
            {CATEGORIES.map((cat, i) => {
              const isActive = i === active;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setOpenIndex(0);
                  }}
                  className={cx(
                    "rounded-pill px-5 py-2.5 text-sm font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60",
                    isActive
                      ? "bg-accent-blue text-white shadow-float-blue"
                      : "ring-1 ring-black/10 text-text-muted hover:text-fg-dark hover:ring-black/20"
                  )}
                >
                  {cat.id}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Accordion for the active category. */}
        <Reveal delay={200} className="mx-auto mt-12 max-w-3xl">
          <div role="tabpanel" aria-label={CATEGORIES[active].id}>
            {items.map((item, i) => {
              const isOpen = i === openIndex;
              return (
                <div key={item.q} className="border-b border-black/10">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60 rounded-md"
                  >
                    <span className="font-medium text-fg-dark sm:text-lg">
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className={cx(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg-dark text-white transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                    >
                      ▾
                    </span>
                  </button>

                  {/* Answer — grid-rows trick animates height open/closed. */}
                  <div
                    className={cx(
                      "grid transition-all duration-300 ease-out",
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-5 pr-12 text-text-muted leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
