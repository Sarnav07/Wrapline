"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import {
  useApproveUnderlying,
  useUnderlyingAllowance,
  useShield,
  useConfidentialBalance,
} from "@zama-fhe/react-sdk";
import { useRegistryPairs, type RegistryRow } from "@/lib/registry";
import { erc20MintableAbi, FAUCET_AMOUNT } from "@/lib/erc20";

function StatusLine({ label, pending, error }: { label: string; pending: boolean; error?: Error | null }) {
  if (pending) return <p className="mt-2 text-xs text-[#FFC83D]">{label}…</p>;
  if (error) return <p className="mt-2 text-xs text-rose-300">{error.message}</p>;
  return null;
}

function WrapInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;

  const { rows } = useRegistryPairs();
  const [selectedConf, setSelectedConf] = useState<string | null>(null);

  // Keep a valid selection as the chain (and therefore the pair list) changes.
  const pair: RegistryRow | undefined = useMemo(() => {
    return rows.find((r) => r.confidentialTokenAddress === selectedConf) ?? rows[0];
  }, [rows, selectedConf]);

  const [amount, setAmount] = useState("");

  const decimals = pair?.underlying.decimals ?? 18;
  const amountBig = useMemo(() => {
    if (!amount || Number(amount) <= 0) return 0n;
    try {
      return parseUnits(amount, decimals);
    } catch {
      return 0n;
    }
  }, [amount, decimals]);

  // Underlying ERC-20 balance of the connected wallet.
  const balance = useReadContract({
    abi: erc20MintableAbi,
    address: pair?.erc20Address,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(pair && address) },
  });

  // Allowance granted to the wrapper, and the resulting confidential balance handle.
  const allowance = useUnderlyingAllowance(
    { tokenAddress: pair?.confidentialTokenAddress ?? zeroAddress, wrapperAddress: pair?.confidentialTokenAddress ?? zeroAddress },
    { enabled: Boolean(pair && address) },
  );
  const confidentialBalance = useConfidentialBalance(
    { tokenAddress: pair?.confidentialTokenAddress ?? zeroAddress },
    { enabled: Boolean(pair && address) },
  );

  // Faucet: mint the underlying ERC-20 (Sepolia cTokenMock).
  const faucet = useWriteContract();
  const faucetReceipt = useWaitForTransactionReceipt({ hash: faucet.data });

  // Approve + shield via the SDK (config: confidential token doubles as the wrapper).
  const zamaConfig = { tokenAddress: pair?.confidentialTokenAddress ?? zeroAddress, wrapperAddress: pair?.confidentialTokenAddress ?? zeroAddress };
  const approve = useApproveUnderlying(zamaConfig);
  const shield = useShield(zamaConfig);

  // Refresh balance once the faucet tx confirms.
  useEffect(() => {
    if (faucetReceipt.isSuccess) balance.refetch();
  }, [faucetReceipt.isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh reads once a wrap confirms.
  useEffect(() => {
    if (shield.isSuccess) {
      balance.refetch();
      allowance.refetch();
      confidentialBalance.refetch();
    }
  }, [shield.isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isConnected) {
    return (
      <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
        <h2 className="font-semibold">Faucet &amp; Wrap</h2>
        <p className="mt-3 text-sm text-[#7A8699]">Connect a wallet to claim test tokens and wrap them.</p>
      </section>
    );
  }

  if (!pair) {
    return (
      <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
        <h2 className="font-semibold">Faucet &amp; Wrap</h2>
        <p className="mt-3 text-sm text-[#7A8699]">No pairs available on this network.</p>
      </section>
    );
  }

  const needsApproval = allowance.data !== undefined && amountBig > 0n && allowance.data < amountBig;
  const canWrap = amountBig > 0n && !needsApproval;
  const balanceFmt = balance.data !== undefined ? formatUnits(balance.data as bigint, decimals) : "—";

  return (
    <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
      <h2 className="font-semibold">Faucet &amp; Wrap</h2>

      {/* Pair selector */}
      <label className="mt-4 block text-xs uppercase tracking-wider text-[#7A8699]">Pair</label>
      <select
        value={pair.confidentialTokenAddress}
        onChange={(e) => setSelectedConf(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[#070A12] px-3 py-2 text-sm"
      >
        {rows.map((r) => (
          <option key={r.confidentialTokenAddress} value={r.confidentialTokenAddress}>
            {r.underlying.symbol} → {r.confidential.symbol}
          </option>
        ))}
      </select>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-[#7A8699]">{pair.underlying.symbol} balance</span>
        <span className="tabular-nums">{balanceFmt}</span>
      </div>

      {/* Faucet (Sepolia only) */}
      {isSepolia ? (
        <button
          type="button"
          disabled={faucet.isPending || faucetReceipt.isLoading}
          onClick={() =>
            faucet.writeContract({
              abi: erc20MintableAbi,
              address: pair.erc20Address,
              functionName: "mint",
              args: [address!, parseUnits(String(FAUCET_AMOUNT), decimals)],
            })
          }
          className="mt-3 w-full rounded-lg bg-white/5 px-3 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
        >
          {faucet.isPending || faucetReceipt.isLoading
            ? "Minting…"
            : `Faucet: mint ${FAUCET_AMOUNT} ${pair.underlying.symbol}`}
        </button>
      ) : (
        <p className="mt-3 text-xs text-[#7A8699]">The faucet is Sepolia-only. Switch to Sepolia to claim test tokens.</p>
      )}
      <StatusLine label="Confirming faucet" pending={faucetReceipt.isLoading} error={faucet.error} />

      {/* Amount + wrap */}
      <label className="mt-5 block text-xs uppercase tracking-wider text-[#7A8699]">Amount to wrap</label>
      <input
        inputMode="decimal"
        placeholder="0.0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[#070A12] px-3 py-2 text-sm tabular-nums"
      />
      <p className="mt-1 text-xs text-[#7A8699]">
        Wrapped 1:1 into {pair.confidential.symbol} at the on-chain rate; fractions below the wrapper&apos;s
        precision aren&apos;t minted.
      </p>

      {needsApproval ? (
        <button
          type="button"
          disabled={approve.isPending}
          onClick={() => approve.mutate({})}
          className="mt-3 w-full rounded-lg bg-[#FFC83D] px-3 py-2 text-sm font-semibold text-[#0B0E14] hover:brightness-95 disabled:opacity-50"
        >
          {approve.isPending ? "Approving…" : `Approve ${pair.underlying.symbol}`}
        </button>
      ) : (
        <button
          type="button"
          disabled={!canWrap || shield.isPending}
          onClick={() => shield.mutate({ amount: amountBig })}
          className="mt-3 w-full rounded-lg bg-[#FFC83D] px-3 py-2 text-sm font-semibold text-[#0B0E14] hover:brightness-95 disabled:opacity-50"
        >
          {shield.isPending ? "Wrapping…" : "Wrap"}
        </button>
      )}
      <StatusLine label="Approving" pending={approve.isPending} error={approve.error} />
      <StatusLine label="Wrapping" pending={shield.isPending} error={shield.error} />

      {shield.isSuccess && (
        <p className="mt-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300 ring-1 ring-emerald-400/30">
          Wrapped. Encrypted {pair.confidential.symbol} balance handle:{" "}
          <span className="font-mono">
            {confidentialBalance.data ? `0x${confidentialBalance.data.toString(16).slice(0, 12)}…` : "updating…"}
          </span>{" "}
          (decrypt it in M3).
        </p>
      )}
    </section>
  );
}

/** Post-mount gate so the SDK hooks only run inside the ZamaProvider context. */
export function WrapCard() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
        <h2 className="font-semibold">Faucet &amp; Wrap</h2>
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-white/5" />
      </section>
    );
  }
  return <WrapInner />;
}
