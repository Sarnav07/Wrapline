"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { SUPPORTED_NETWORKS } from "@/lib/wagmi";
import { RegistryTable } from "@/components/RegistryTable";
import { ActionConsole } from "@/components/app/ActionConsole";
import { OrbField } from "@/components/app/OrbField";
import { Monogram } from "@/components/landing/Monogram";

export default function Home() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const network = SUPPORTED_NETWORKS[chainId];
  const supported = Boolean(network);

  return (
    <main className="relative min-h-screen bg-bg-dark text-foreground">
      {/* Floating blue orb field + a soft central glow behind the console */}
      <OrbField />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,107,228,0.16),transparent_65%)]"
      />

      <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl ring-1 ring-white/10">
            <Monogram size={22} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight">Wrapline</span>
            <span className="block text-xs text-[#7A8699]">Confidential Wrapper Registry</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {isConnected && (
            <span className="hidden items-center gap-2 rounded-pill bg-white/5 px-3 py-1.5 text-xs ring-1 ring-white/10 sm:flex">
              <span className={`h-2 w-2 rounded-full ${supported ? "bg-emerald-400" : "bg-amber-400"}`} />
              {network ?? `Unsupported (chain ${chainId})`}
            </span>
          )}
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-md px-5 pt-8 text-center sm:pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue">
          Zama Developer Program
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Wrap, unwrap, and decrypt confidential tokens.
        </h1>
      </section>

      {/* The swap console */}
      <section className="relative mx-auto w-full max-w-md px-5 pt-8">
        <ActionConsole />
      </section>

      {/* Registry browser (wide) */}
      <section className="relative mx-auto mt-14 w-full max-w-5xl px-5 pb-20">
        <h2 className="mb-4 font-display text-lg font-semibold">Registry</h2>
        <RegistryTable />
      </section>
    </main>
  );
}
