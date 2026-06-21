"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import {
  useApproveUnderlying,
  useUnderlyingAllowance,
  useShield,
  useConfidentialBalance,
} from "@zama-fhe/react-sdk";
import { useRegistryPairs, type RegistryRow } from "@/lib/registry";
import { erc20MintableAbi, erc20CapAbi, FAUCET_AMOUNT } from "@/lib/erc20";
import { humanizeError } from "@/lib/errors";
import { useConfirm } from "./ConfirmModal";
import { NetworkBanner } from "./NetworkBanner";

function StatusLine({ label, pending, error }: { label: string; pending: boolean; error?: Error | null }) {
  if (pending) return <p className="mt-2 text-xs text-accent-blue">{label}…</p>;
  if (error) return <p className="mt-2 text-xs text-rose-300">{humanizeError(error)}</p>;
  return null;
}

function WrapInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;
  const isMainnet = chainId === mainnet.id;
  const { switchChain, isPending: switchPending } = useSwitchChain();
  const { confirm, modal } = useConfirm();

  const { validRows: rows } = useRegistryPairs();
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

  // Optional cap probe: cTokenMock may expose MAX_AMOUNT_PER_ADDRESS + mintedAmount.
  // retry:false — degrade silently if the function doesn't exist on this contract.
  const cap = useReadContract({
    abi: erc20CapAbi,
    address: pair?.erc20Address,
    functionName: "MAX_AMOUNT_PER_ADDRESS",
    query: { enabled: isSepolia && Boolean(pair && address), retry: false },
  });
  const minted = useReadContract({
    abi: erc20CapAbi,
    address: pair?.erc20Address,
    functionName: "mintedAmount",
    args: address ? [address] : undefined,
    query: { enabled: isSepolia && Boolean(pair && address) && cap.isSuccess, retry: false },
  });
  const remainingMint = useMemo(() => {
    if (cap.data === undefined || minted.data === undefined) return undefined;
    const rem = (cap.data as bigint) - (minted.data as bigint);
    return rem < 0n ? 0n : rem;
  }, [cap.data, minted.data]);

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
      <section className="rounded-card border border-white/8 bg-[#0E1424] p-6 shadow-float">
        <h2 className="font-semibold">Faucet &amp; Wrap</h2>
        <p className="mt-3 text-sm text-[#7A8699]">Connect a wallet to claim test tokens and wrap them.</p>
      </section>
    );
  }

  if (!pair) {
    return (
      <section className="rounded-card border border-white/8 bg-[#0E1424] p-6 shadow-float">
        <h2 className="font-semibold">Faucet &amp; Wrap</h2>
        <p className="mt-3 text-sm text-[#7A8699]">No pairs available on this network.</p>
      </section>
    );
  }

  const needsApproval = allowance.data !== undefined && amountBig > 0n && allowance.data < amountBig;
  const insufficient = balance.data !== undefined && amountBig > 0n && (balance.data as bigint) < amountBig;
  const canWrap = amountBig > 0n && !needsApproval && !insufficient;
  const balanceFmt = balance.data !== undefined ? formatUnits(balance.data as bigint, decimals) : "—";

  // Mainnet writes move real funds — gate them behind an explicit confirm.
  async function doWrap() {
    if (isMainnet) {
      const ok = await confirm({
        title: "Wrap on Ethereum mainnet?",
        tone: "danger",
        confirmLabel: "Wrap real funds",
        body: (
          <>
            You&apos;re about to wrap <span className="font-semibold text-[#EAF0FA]">{amount} {pair!.underlying.symbol}</span>{" "}
            of real funds on Ethereum mainnet. Start with a tiny amount to test the flow.
          </>
        ),
      });
      if (!ok) return;
    }
    shield.mutate({ amount: amountBig });
  }

  return (
    <section className="rounded-card border border-white/8 bg-[#0E1424] p-6 shadow-float">
      <h2 className="font-semibold">Faucet &amp; Wrap</h2>
      <NetworkBanner />
      {modal}

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
        <>
          <button
            type="button"
            disabled={faucet.isPending || faucetReceipt.isLoading || remainingMint === 0n}
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
              : remainingMint === 0n
              ? `Mint cap reached — no more ${pair.underlying.symbol} available`
              : `Faucet: mint ${FAUCET_AMOUNT} ${pair.underlying.symbol}`}
          </button>
          {remainingMint !== undefined && remainingMint > 0n && (
            <p className="mt-1 text-xs text-[#7A8699]">
              Remaining mintable: {formatUnits(remainingMint, decimals)} {pair.underlying.symbol}
            </p>
          )}
        </>
      ) : isMainnet ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
          <p className="text-xs text-amber-200">Faucet is Sepolia-only.</p>
          <button
            type="button"
            disabled={switchPending}
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="rounded-md bg-accent-blue px-3 py-1.5 text-xs font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
          >
            {switchPending ? "Switching…" : "Switch to Sepolia"}
          </button>
        </div>
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
      {isMainnet && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-[#7A8699]">Tiny test amounts:</span>
          {["0.001", "0.01"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-[#94A2B8] ring-1 ring-white/10 hover:bg-white/10"
            >
              {v}
            </button>
          ))}
        </div>
      )}
      {insufficient && (
        <p className="mt-2 text-xs text-rose-300">
          Insufficient {pair.underlying.symbol} balance — you have {balanceFmt}.
          {isSepolia ? " Use the faucet above." : ""}
        </p>
      )}

      {needsApproval ? (
        <button
          type="button"
          disabled={approve.isPending}
          onClick={() => approve.mutate({})}
          className="mt-3 w-full rounded-lg bg-accent-blue px-3 py-2 text-sm font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
        >
          {approve.isPending ? "Approving…" : `Approve ${pair.underlying.symbol}`}
        </button>
      ) : (
        <button
          type="button"
          disabled={!canWrap || shield.isPending}
          onClick={doWrap}
          className="mt-3 w-full rounded-lg bg-accent-blue px-3 py-2 text-sm font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
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
      <section className="rounded-card border border-white/8 bg-[#0E1424] p-6 shadow-float">
        <h2 className="font-semibold">Faucet &amp; Wrap</h2>
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-white/5" />
      </section>
    );
  }
  return <WrapInner />;
}
