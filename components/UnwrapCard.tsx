"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { mainnet } from "wagmi/chains";
import { formatUnits, numberToHex, parseUnits, zeroAddress, type Address, type Hex } from "viem";
import {
  useConfidentialBalance,
  useUnshield,
  useUserDecrypt,
  useResumeUnshield,
  indexedDBStorage,
  savePendingUnshield,
  loadPendingUnshield,
  clearPendingUnshield,
} from "@zama-fhe/react-sdk";
import { useRegistryPairs, type RegistryRow } from "@/lib/registry";
import { humanizeError } from "@/lib/errors";
import { useConfirm } from "./ConfirmModal";
import { NetworkBanner } from "./NetworkBanner";

const storage = indexedDBStorage;

type Stage = "idle" | "unwrapping" | "finalizing" | "submitted" | "done" | "error";

const STEP_LABELS = ["Unwrap request", "KMS public-decrypt", "Finalize"] as const;

function activeStep(stage: Stage): number {
  switch (stage) {
    case "unwrapping":
      return 0;
    case "finalizing":
      return 1;
    case "submitted":
      return 2;
    case "done":
      return 3;
    default:
      return -1;
  }
}

function Stepper({ stage }: { stage: Stage }) {
  const active = activeStep(stage);
  if (active < 0) return null;
  return (
    <ol className="mt-3 space-y-1.5">
      {STEP_LABELS.map((label, i) => {
        const done = active > i || stage === "done";
        const current = active === i && stage !== "done";
        return (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span
              className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${
                done ? "bg-emerald-400 text-[#0B0E14]" : current ? "bg-accent-blue text-accent-blue-foreground" : "bg-white/10 text-[#7A8699]"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={done ? "text-emerald-300" : current ? "text-accent-blue" : "text-[#7A8699]"}>
              {label}
              {current ? "…" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** One resumable unwrap: a saved unwrap tx whose finalize step never completed. */
function ResumeEntry({
  wrapper,
  symbol,
  txHash,
  onResolved,
}: {
  wrapper: Address;
  symbol: string;
  txHash: Hex;
  onResolved: () => void;
}) {
  const resume = useResumeUnshield({ tokenAddress: wrapper, wrapperAddress: wrapper });

  const dismiss = useCallback(async () => {
    await clearPendingUnshield(storage, wrapper);
    onResolved();
  }, [wrapper, onResolved]);

  return (
    <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
      <p className="text-xs text-amber-200">
        Unfinished unwrap of <span className="font-semibold">{symbol}</span> — unwrap tx{" "}
        <span className="font-mono">
          {txHash.slice(0, 8)}…{txHash.slice(-4)}
        </span>{" "}
        was submitted but not finalized.
      </p>
      {resume.isError && <p className="mt-1 text-xs text-rose-300">{humanizeError(resume.error)}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={resume.isPending}
          onClick={() =>
            resume.mutate(
              { unwrapTxHash: txHash },
              {
                onSuccess: async () => {
                  await clearPendingUnshield(storage, wrapper);
                  onResolved();
                },
              },
            )
          }
          className="rounded-md bg-accent-blue px-3 py-1.5 text-xs font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
        >
          {resume.isPending ? "Finalizing…" : "Resume finalize"}
        </button>
        <button
          type="button"
          disabled={resume.isPending}
          onClick={dismiss}
          className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-[#94A2B8] ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function UnwrapInner() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isMainnet = chainId === mainnet.id;
  const { confirm, modal } = useConfirm();
  const { rows, validRows } = useRegistryPairs();
  const [selectedConf, setSelectedConf] = useState<string | null>(null);

  const pair: RegistryRow | undefined = useMemo(
    () => validRows.find((r) => r.confidentialTokenAddress === selectedConf) ?? validRows[0],
    [validRows, selectedConf],
  );

  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("idle");

  const decimals = pair?.confidential.decimals ?? 6;
  const amountBig = useMemo(() => {
    if (!amount || Number(amount) <= 0) return 0n;
    try {
      return parseUnits(amount, decimals);
    } catch {
      return 0n;
    }
  }, [amount, decimals]);

  const config = {
    tokenAddress: pair?.confidentialTokenAddress ?? zeroAddress,
    wrapperAddress: pair?.confidentialTokenAddress ?? zeroAddress,
  };
  const unshield = useUnshield(config);

  // Confidential balance display — read the handle, reveal on demand.
  const [revealed, setRevealed] = useState(false);
  const confBalance = useConfidentialBalance(
    { tokenAddress: pair?.confidentialTokenAddress ?? zeroAddress },
    { enabled: Boolean(pair && address) },
  );
  const handleHex = useMemo(
    () =>
      confBalance.data !== undefined && confBalance.data !== 0n
        ? numberToHex(confBalance.data, { size: 32 })
        : undefined,
    [confBalance.data],
  );
  const decrypt = useUserDecrypt(
    { handles: handleHex ? [{ handle: handleHex, contractAddress: pair?.confidentialTokenAddress ?? zeroAddress }] : [] },
    { enabled: revealed && Boolean(handleHex) },
  );
  const cleartext = decrypt.data ? Object.values(decrypt.data)[0] : undefined;
  const confBalanceFmt =
    cleartext !== undefined
      ? `${formatUnits(cleartext as bigint, pair?.confidential.decimals ?? 18)} ${pair?.confidential.symbol ?? ""}`
      : null;

  // Scan every wrapper on this chain for an interrupted unwrap (resume drawer).
  const [pending, setPending] = useState<{ wrapper: Address; symbol: string; txHash: Hex }[]>([]);
  const [scanTick, setScanTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found: { wrapper: Address; symbol: string; txHash: Hex }[] = [];
      for (const r of rows) {
        const tx = await loadPendingUnshield(storage, r.confidentialTokenAddress);
        if (tx) found.push({ wrapper: r.confidentialTokenAddress, symbol: r.confidential.symbol, txHash: tx });
      }
      if (!cancelled) setPending(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows, scanTick]);
  const rescan = useCallback(() => setScanTick((t) => t + 1), []);

  // Reset reveal when the selected token changes.
  useEffect(() => setRevealed(false), [pair?.confidentialTokenAddress]);

  if (!isConnected) {
    return (
      <section className="rounded-card border border-white/8 bg-[#0E1424] p-6 shadow-float">
        <h2 className="font-semibold">Unwrap</h2>
        <p className="mt-3 text-sm text-[#7A8699]">Connect a wallet to unwrap back to ERC-20.</p>
      </section>
    );
  }

  const wrapper = pair?.confidentialTokenAddress;
  const canUnwrap = Boolean(pair) && amountBig > 0n && stage !== "unwrapping" && stage !== "finalizing" && stage !== "submitted";

  async function runUnwrap() {
    if (!wrapper) return;
    if (isMainnet) {
      const ok = await confirm({
        title: "Unwrap on Ethereum mainnet?",
        tone: "danger",
        confirmLabel: "Unwrap real funds",
        body: (
          <>
            You&apos;re about to unwrap <span className="font-semibold text-[#EAF0FA]">{amount} {pair!.confidential.symbol}</span>{" "}
            back to ERC-20 on Ethereum mainnet. This moves real funds.
          </>
        ),
      });
      if (!ok) return;
    }
    setStage("unwrapping");
    unshield.mutate(
      {
        amount: amountBig,
        onUnwrapSubmitted: (txHash) => {
          // Checkpoint immediately: if finalize is interrupted, we can resume from here.
          void savePendingUnshield(storage, wrapper, txHash);
          setStage("finalizing");
          rescan();
        },
        onFinalizing: () => setStage("finalizing"),
        onFinalizeSubmitted: () => setStage("submitted"),
      },
      {
        onSuccess: async () => {
          await clearPendingUnshield(storage, wrapper);
          setStage("done");
          setAmount("");
          rescan();
        },
        onError: () => setStage("error"),
      },
    );
  }

  return (
    <section className="rounded-card border border-white/8 bg-[#0E1424] p-6 shadow-float">
      <h2 className="font-semibold">Unwrap</h2>
      <p className="mt-1 text-xs text-[#7A8699]">
        ERC-7984 → ERC-20. Async: the unwrap is requested on-chain, the KMS publicly decrypts the amount, then
        the wrapper finalizes. Decrypt your balance in the panel above to see what you can unwrap.
      </p>
      <NetworkBanner />
      {modal}

      {pending.length > 0 && (
        <div className="mt-4 space-y-2">
          {pending.map((p) => (
            <ResumeEntry key={p.txHash} wrapper={p.wrapper} symbol={p.symbol} txHash={p.txHash} onResolved={rescan} />
          ))}
        </div>
      )}

      {pair && (
        <>
          <label className="mt-4 block text-xs uppercase tracking-wider text-[#7A8699]">Token</label>
          <select
            value={pair.confidentialTokenAddress}
            onChange={(e) => {
              setSelectedConf(e.target.value);
              setStage("idle");
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#070A12] px-3 py-2 text-sm"
          >
            {validRows.map((r) => (
              <option key={r.confidentialTokenAddress} value={r.confidentialTokenAddress}>
                {r.confidential.symbol} → {r.underlying.symbol}
              </option>
            ))}
          </select>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-[#7A8699]">{pair.confidential.symbol} balance</span>
            {confBalance.isLoading ? (
              <span className="text-xs text-[#7A8699]">Loading…</span>
            ) : confBalance.data === 0n ? (
              <span className="tabular-nums">0 {pair.confidential.symbol}</span>
            ) : confBalanceFmt !== null ? (
              <span className="tabular-nums text-emerald-300">{confBalanceFmt}</span>
            ) : handleHex ? (
              <button
                type="button"
                disabled={revealed && decrypt.isFetching}
                onClick={() => setRevealed(true)}
                className="text-xs text-accent-blue hover:underline disabled:opacity-50"
              >
                {revealed && decrypt.isFetching ? "Decrypting…" : "Reveal"}
              </button>
            ) : (
              <span className="tabular-nums">—</span>
            )}
          </div>

          <label className="mt-4 block text-xs uppercase tracking-wider text-[#7A8699]">Amount to unwrap</label>
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#070A12] px-3 py-2 text-sm tabular-nums"
          />
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

          <button
            type="button"
            disabled={!canUnwrap}
            onClick={runUnwrap}
            className="mt-3 w-full rounded-lg bg-accent-blue px-3 py-2 text-sm font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
          >
            {stage === "unwrapping" || stage === "finalizing" || stage === "submitted" ? "Unwrapping…" : "Unwrap"}
          </button>

          <Stepper stage={stage} />

          {stage === "done" && (
            <p className="mt-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300 ring-1 ring-emerald-400/30">
              Unwrapped. Your {pair.underlying.symbol} balance is back in the wrapped panel.
            </p>
          )}
          {stage === "error" && (
            <p className="mt-3 rounded-lg bg-rose-400/10 px-3 py-2 text-xs text-rose-200 ring-1 ring-rose-400/30">
              {humanizeError(unshield.error, "Unwrap failed.")} If the unwrap tx already landed, use Resume above.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Post-mount gate so the SDK hooks only run inside the ZamaProvider context. */
export function UnwrapCard() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <section className="rounded-card border border-white/8 bg-[#0E1424] p-6 shadow-float">
        <h2 className="font-semibold">Unwrap</h2>
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-white/5" />
      </section>
    );
  }
  return <UnwrapInner />;
}
