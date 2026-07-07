"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useConnectorClient, useReadContract } from "wagmi";
import { mainnet } from "wagmi/chains";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { formatUnits, parseUnits, zeroAddress, type Address, type Hex } from "viem";
import {
  useUnshield,
  useResumeUnshield,
  indexedDBStorage,
  savePendingUnshield,
  loadPendingUnshield,
  clearPendingUnshield,
} from "@zama-fhe/react-sdk";
import { useRegistryPairs, type RegistryRow } from "@/lib/registry";
import { collectText, humanizeError } from "@/lib/errors";
import { withSignatureLock } from "@/lib/signature-lock";
import { CONFIDENTIAL_BALANCE_ABI, ZERO_HANDLE } from "@/lib/fhe";
import { SignatureHint } from "./SignatureHint";
import { useConfirm } from "./ConfirmModal";
import { NetworkBanner } from "./NetworkBanner";
import { TokenSelect } from "./app/TokenSelect";
import { TokenIcon } from "./app/TokenIcon";
import { SwapPanel } from "./app/SwapPanel";

const storage = indexedDBStorage;

function explorerBase(chainId: number) {
  return chainId === mainnet.id ? "https://etherscan.io" : "https://sepolia.etherscan.io";
}

/** Copyable truncated hex value (full value copied to clipboard). */
function CopyHex({ value }: { value: `0x${string}` }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy full value"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable — no-op */
        }
      }}
      className="inline-flex items-center gap-1 font-mono hover:text-cyan-200"
    >
      <span>{value.slice(0, 14)}…{value.slice(-6)}</span>
      <span className="text-[10px] not-italic">{copied ? "✓ copied" : "⧉ copy"}</span>
    </button>
  );
}

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

/** Static token chip for the read-only "you receive" side. */
function TokenChip({ symbol }: { symbol: string }) {
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-pill bg-white/8 py-1.5 pl-1.5 pr-3 ring-1 ring-white/12">
      <TokenIcon symbol={symbol} size={26} />
      <span className="font-display text-sm font-semibold">{symbol}</span>
    </span>
  );
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
                done ? "bg-cyan-400 text-[#0B0E14]" : current ? "bg-accent-blue text-accent-blue-foreground" : "bg-white/10 text-[#7A8699]"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={done ? "text-cyan-300" : current ? "text-accent-blue" : "text-[#7A8699]"}>
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
        Unfinished unwrap of <span className="font-semibold">{symbol}</span>, unwrap tx{" "}
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

export function UnwrapPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isMainnet = chainId === mainnet.id;
  const { openConnectModal } = useConnectModal();
  const { confirm, modal } = useConfirm();
  const { rows, validRows } = useRegistryPairs();
  const [selectedConf, setSelectedConf] = useState<string | null>(null);

  const pair: RegistryRow | undefined = useMemo(
    () => validRows.find((r) => r.confidentialTokenAddress === selectedConf) ?? validRows[0],
    [validRows, selectedConf],
  );

  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [finalizeTx, setFinalizeTx] = useState<Hex | undefined>(undefined);

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

  // Confidential balance display — read the handle, reveal on demand via the real
  // EIP-712 userDecrypt round-trip (lib/fhe.ts). One signature, one round-trip.
  const { data: connectorClient } = useConnectorClient();
  // Reveal handle = on-chain ERC-7984 ciphertext handle (bytes32) via confidentialBalanceOf.
  // NOT useConfidentialBalance, which returns a decoded number userDecrypt rejects.
  const handleRead = useReadContract({
    abi: CONFIDENTIAL_BALANCE_ABI,
    address: pair?.confidentialTokenAddress,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(pair && address) },
  });
  const rawHandle = handleRead.data as `0x${string}` | undefined;
  const handleHex = rawHandle && rawHandle !== ZERO_HANDLE ? rawHandle : undefined;

  const [busy, setBusy] = useState(false);
  const [cleartext, setCleartext] = useState<bigint | undefined>(undefined);
  const [revealError, setRevealError] = useState<unknown>(undefined);

  // One click: bridge the wallet connector to an ethers signer, take one EIP-712
  // signature, run the userDecrypt round-trip. Serialized through the global lock.
  const onReveal = async () => {
    if (!pair || !handleHex) return;
    setRevealError(undefined);
    setBusy(true);
    try {
      const transport = connectorClient?.transport as { request?: unknown } | undefined;
      if (!transport?.request) throw new Error("Wallet transport unavailable. Reconnect and retry.");
      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(transport as never);
      const { revealHandle } = await import("@/lib/fhe");
      const { cleartext: ct } = await withSignatureLock(() =>
        revealHandle({
          handle: handleHex,
          contractAddress: pair.confidentialTokenAddress,
          provider,
          chainId,
        }),
      );
      setCleartext(ct);
    } catch (e) {
      setRevealError(e);
    } finally {
      setBusy(false);
    }
  };
  const confBalanceFmt =
    cleartext !== undefined
      ? `${formatUnits(cleartext, pair?.confidential.decimals ?? 18)} ${pair?.confidential.symbol ?? ""}`
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

  // Manual recovery: seed local storage from a user-provided tx hash (cross-device path).
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryHash, setRecoveryHash] = useState("");
  const [recoveryConf, setRecoveryConf] = useState("");
  const validTxHash = /^0x[0-9a-fA-F]{64}$/.test(recoveryHash);

  const seedRecovery = useCallback(async () => {
    const wrapper = (recoveryConf || pair?.confidentialTokenAddress) as Address | undefined;
    if (!wrapper || !validTxHash) return;
    await savePendingUnshield(storage, wrapper, recoveryHash as Hex);
    setRecoveryHash("");
    setShowRecovery(false);
    rescan();
  }, [recoveryConf, pair?.confidentialTokenAddress, validTxHash, recoveryHash, rescan]);

  // Reset reveal when the selected token changes.
  useEffect(() => {
    setCleartext(undefined);
    setRevealError(undefined);
  }, [pair?.confidentialTokenAddress]);

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
    setFinalizeTx(undefined);
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
        onFinalizeSubmitted: (txHash) => {
          setFinalizeTx(txHash);
          setStage("submitted");
        },
      },
      {
        onSuccess: async (result) => {
          await clearPendingUnshield(storage, wrapper);
          // Fall back to the mined tx hash if the submitted callback didn't fire.
          setFinalizeTx((prev) => prev ?? result.txHash);
          setStage("done");
          setAmount("");
          rescan();
        },
        onError: () => setStage("error"),
      },
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#7A8699]">
        ERC-7984 → ERC-20. Async: the unwrap is requested on-chain, the KMS publicly decrypts the amount, then the
        wrapper finalizes. Reveal your balance below to see what you can unwrap.
      </p>
      <NetworkBanner />
      {modal}

      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((p) => (
            <ResumeEntry key={p.txHash} wrapper={p.wrapper} symbol={p.symbol} txHash={p.txHash} onResolved={rescan} />
          ))}
        </div>
      )}

      {/* Cross-device recovery: seed a tx hash manually so ResumeEntry can finalize it. */}
      <div>
        <button
          type="button"
          onClick={() => setShowRecovery((s) => !s)}
          className="text-xs text-[#7A8699] underline-offset-2 hover:text-[#94A2B8] hover:underline"
        >
          {showRecovery ? "Hide recovery" : "Recover unwrap from another device…"}
        </button>
        {showRecovery && (
          <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-[#0E0B13] p-3">
            <p className="text-xs text-[#7A8699]">
              Paste your unwrap transaction hash and select the token to resume finalization.
            </p>
            <select
              value={recoveryConf}
              onChange={(e) => setRecoveryConf(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#17131E] px-3 py-2 text-sm"
            >
              <option value="">Select token…</option>
              {validRows.map((r) => (
                <option key={r.confidentialTokenAddress} value={r.confidentialTokenAddress}>
                  {r.confidential.symbol}
                </option>
              ))}
            </select>
            <input
              spellCheck={false}
              placeholder="0x… (66-char tx hash)"
              value={recoveryHash}
              onChange={(e) => setRecoveryHash(e.target.value.trim())}
              className="w-full rounded-lg border border-white/10 bg-[#17131E] px-3 py-2 font-mono text-xs"
            />
            <button
              type="button"
              disabled={!validTxHash || !recoveryConf}
              onClick={seedRecovery}
              className="w-full rounded-lg bg-accent-blue px-3 py-2 text-xs font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      {pair && (
        <>
          {/* You unwrap (confidential ERC-7984) */}
          <SwapPanel
            label="You unwrap"
            input={
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent font-display text-4xl tabular-nums outline-none placeholder:text-white/25 sm:text-5xl"
              />
            }
            select={
              <TokenSelect
                rows={validRows}
                value={pair.confidentialTokenAddress}
                onChange={(addr) => {
                  setSelectedConf(addr);
                  setStage("idle");
                }}
                variant="confidential"
              />
            }
            footer={
              <>
                <span className="text-[#7A8699]">{pair.confidential.symbol} balance</span>
                {handleRead.isLoading ? (
                  <span className="text-xs text-[#7A8699]">Loading…</span>
                ) : rawHandle === ZERO_HANDLE ? (
                  <span className="tabular-nums">0 {pair.confidential.symbol}</span>
                ) : !handleHex ? (
                  <span className="tabular-nums">-</span>
                ) : busy ? (
                  <span className="block text-right">
                    <span className="text-xs text-[#7A8699]">Confirm in your wallet, then decrypting…</span>
                    <SignatureHint active={busy} />
                  </span>
                ) : revealError ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-rose-300" title={collectText(revealError)}>
                      {humanizeError(revealError, "Decryption failed")}
                    </span>
                    <button type="button" onClick={onReveal} className="text-xs text-accent-blue hover:underline">
                      Retry
                    </button>
                  </span>
                ) : confBalanceFmt !== null ? (
                  <span className="tabular-nums text-cyan-300">{confBalanceFmt}</span>
                ) : (
                  <button type="button" onClick={onReveal} className="text-xs text-accent-blue hover:underline">
                    Reveal
                  </button>
                )}
              </>
            }
          />

          {/* Direction arrow */}
          <div className="flex justify-center">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 text-white/60">↓</span>
          </div>

          {/* You receive (underlying ERC-20, read-only) */}
          <SwapPanel
            label="You receive"
            input={
              <span className="block font-display text-4xl tabular-nums text-white/80 sm:text-5xl">
                {amount && Number(amount) > 0 ? amount : "0.0"}
              </span>
            }
            select={<TokenChip symbol={pair.underlying.symbol} />}
            footer={<span className="text-[#7A8699]">Unwrapped 1:1 back to {pair.underlying.symbol}.</span>}
          />

          {isMainnet && (
            <div className="flex items-center gap-2">
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

          {!isConnected ? (
            <button
              type="button"
              onClick={() => openConnectModal?.()}
              className="w-full rounded-pill bg-accent-blue px-3 py-3 text-sm font-semibold text-accent-blue-foreground shadow-float-blue transition hover:brightness-110"
            >
              Connect Wallet
            </button>
          ) : (
            <button
              type="button"
              disabled={!canUnwrap}
              onClick={runUnwrap}
              className="w-full rounded-pill bg-accent-blue px-3 py-3 text-sm font-semibold text-accent-blue-foreground shadow-float-blue transition hover:brightness-110 disabled:opacity-50"
            >
              {stage === "unwrapping" || stage === "finalizing" || stage === "submitted" ? "Unwrapping…" : "Unwrap"}
            </button>
          )}

          <Stepper stage={stage} />

          {stage === "done" && (
            <div className="space-y-1 rounded-xl bg-cyan-400/10 px-3 py-2 text-xs text-cyan-300 ring-1 ring-cyan-400/30">
              <p>Unwrapped. Your {pair.underlying.symbol} balance is back in the Wrap tab.</p>
              {finalizeTx && (
                <p>
                  Finalize tx: <CopyHex value={finalizeTx} />{" "}
                  <a
                    href={`${explorerBase(chainId)}/tx/${finalizeTx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-cyan-200"
                  >
                    view on Etherscan
                  </a>
                </p>
              )}
              <p className="text-cyan-300/70">
                Or check the{" "}
                <a
                  href={`${explorerBase(chainId)}/address/${pair.erc20Address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-cyan-200"
                >
                  {pair.underlying.symbol} contract
                </a>{" "}
                — your ERC-20 balance rose by the unwrapped amount.
              </p>
            </div>
          )}
          {stage === "error" && (
            <p className="rounded-xl bg-rose-400/10 px-3 py-2 text-xs text-rose-200 ring-1 ring-rose-400/30">
              {humanizeError(unshield.error, "Unwrap failed.")} If the unwrap tx already landed, use Resume above.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** Post-mount gate so the SDK hooks only run inside the ZamaProvider context. */
export function UnwrapCard() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return <div className="h-24 animate-pulse rounded-lg bg-white/5" />;
  }
  return <UnwrapPanel />;
}
