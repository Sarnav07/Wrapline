"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { SUPPORTED_NETWORKS } from "@/lib/wagmi";
import { RegistryTable } from "@/components/RegistryTable";
import { WrapCard } from "@/components/WrapCard";
import { UnwrapCard } from "@/components/UnwrapCard";
import { DecryptCard } from "@/components/DecryptCard";
import { NetworkBanner } from "@/components/NetworkBanner";
import { Monogram } from "@/components/landing/Monogram";

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const network = SUPPORTED_NETWORKS[chainId];
  const supported = Boolean(network);

  return (
    <main className="min-h-screen bg-[#070A12] text-[#EAF0FA] flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl ring-1 ring-white/10">
            <Monogram size={22} />
          </span>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight text-lg">Wrapline</p>
            <p className="text-xs text-[#7A8699]">Confidential Wrapper Registry</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white/50 hover:text-white text-sm">← Back to site</Link>
          <ConnectButton showBalance={false} chainStatus="full" />
        </div>
      </header>

      <section className="flex-1 mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <p className="text-accent-blue text-sm font-semibold tracking-[0.18em] uppercase">
          Zama Developer Program
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
          The official Confidential Wrappers Registry, made usable.
        </h1>
        <p className="mt-4 text-[#94A2B8] max-w-2xl">
          Browse every ERC-20 ↔ ERC-7984 pair on Sepolia and Ethereum mainnet, wrap and
          unwrap any pair, decrypt balances via EIP-712, and faucet test tokens. Connect a
          wallet to begin.
        </p>

        <div className="mt-10 rounded-2xl border border-white/8 bg-[#0E1424] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Connection</h2>
            <span
              className={`text-xs rounded-full px-3 py-1 ring-1 ${
                isConnected
                  ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"
                  : "bg-white/5 text-[#94A2B8] ring-white/10"
              }`}
            >
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#7A8699]">Wallet</dt>
              <dd className="font-mono truncate">
                {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#7A8699]">Network</dt>
              <dd className="flex items-center gap-2">
                <span>{network ?? (isConnected ? `Unsupported (chain ${chainId})` : "—")}</span>
                {isConnected && (
                  <span
                    className={`h-2 w-2 rounded-full ${supported ? "bg-emerald-400" : "bg-amber-400"}`}
                  />
                )}
              </dd>
            </div>
          </dl>

          <NetworkBanner />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <RegistryTable />
          <div className="space-y-6">
            <WrapCard />
            <UnwrapCard />
            <DecryptCard />
          </div>
        </div>
      </section>
    </main>
  );
}
