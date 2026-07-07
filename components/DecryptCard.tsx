"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useConnectorClient, useReadContract } from "wagmi";
import { erc20Abi, formatUnits, isAddress, type Address } from "viem";
import { useConfidentialBalance, useIsConfidential } from "@zama-fhe/react-sdk";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRegistryPairs, type RegistryRow } from "@/lib/registry";
import { collectText, humanizeError } from "@/lib/errors";
import { withSignatureLock } from "@/lib/signature-lock";
import { CONFIDENTIAL_BALANCE_ABI, ZERO_HANDLE } from "@/lib/fhe";
import { NetworkBanner } from "./NetworkBanner";
import { SignatureHint } from "./SignatureHint";
import { TokenSelect } from "./app/TokenSelect";
import { TokenIcon } from "./app/TokenIcon";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

function formatClear(value: bigint | boolean | `0x${string}`, decimals: number) {
  if (typeof value === "bigint") return formatUnits(value, decimals);
  return String(value);
}

/** Friendly message for a failed reveal — ACL denials get a plain-language line. */
function revealErrorMessage(error: unknown): string {
  const msg = collectText(error);
  if (/not authorized|acl|not allowed|user decrypt/i.test(msg)) {
    return "This wallet isn't authorized to decrypt that token's balance.";
  }
  return humanizeError(error, "Decryption failed");
}

/**
 * One decryptable token. Reads the connected wallet's encrypted balance handle,
 * and only after the user clicks Reveal runs the real EIP-712 user-decryption via
 * `revealHandle` (lib/fhe.ts) — one signature, one relayer/KMS round-trip, no
 * react-query retry storm. The holder can always decrypt their own balance (ACL
 * granted on mint/transfer). The relayer SDK caches the session keypair, so later
 * reveals on the same chain don't re-prompt.
 */
function DecryptRow({
  tokenAddress,
  symbol,
  knownDecimals,
}: {
  tokenAddress: Address;
  symbol?: string;
  knownDecimals?: number;
}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: connectorClient } = useConnectorClient();

  // Fall back to reading decimals on-chain for pasted tokens.
  const decimalsRead = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "decimals",
    query: { enabled: knownDecimals === undefined },
  });
  const decimals = knownDecimals ?? decimalsRead.data ?? 0;

  // The reveal handle is the on-chain ERC-7984 ciphertext handle (bytes32), read
  // directly via confidentialBalanceOf — NOT the react-SDK's useConfidentialBalance,
  // which returns a decoded balance number that userDecrypt rejects ("Unknown FheType").
  const handleRead = useReadContract({
    abi: CONFIDENTIAL_BALANCE_ABI,
    address: tokenAddress,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const rawHandle = handleRead.data as `0x${string}` | undefined;
  const isZero = rawHandle === ZERO_HANDLE;
  const handleHex = rawHandle && rawHandle !== ZERO_HANDLE ? rawHandle : undefined;

  const [busy, setBusy] = useState(false);
  const [cleartext, setCleartext] = useState<bigint | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);

  // One click: bridge the wallet connector to an ethers signer, take one EIP-712
  // signature, and run the userDecrypt round-trip. Serialized through the global
  // lock so at most one wallet prompt is pending app-wide.
  const onReveal = async () => {
    if (!handleHex) return;
    setError(undefined);
    setBusy(true);
    try {
      const transport = connectorClient?.transport as { request?: unknown } | undefined;
      if (!transport?.request) throw new Error("Wallet transport unavailable. Reconnect and retry.");
      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(transport as never);
      const { revealHandle } = await import("@/lib/fhe");
      const { cleartext: ct } = await withSignatureLock(() =>
        revealHandle({ handle: handleHex, contractAddress: tokenAddress, provider, chainId }),
      );
      setCleartext(ct);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  // Reset the reveal when the token changes.
  useEffect(() => {
    setCleartext(undefined);
    setError(undefined);
  }, [tokenAddress]);

  return (
    <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          {symbol && <TokenIcon symbol={symbol} size={24} />}
          <span className="min-w-0 font-mono text-xs text-[#94A2B8]">
            {symbol ? `${symbol} · ` : ""}
            {tokenAddress.slice(0, 6)}…{tokenAddress.slice(-4)}
          </span>
        </span>
        {!isZero && (
          <button
            type="button"
            disabled={handleRead.data === undefined || busy}
            onClick={onReveal}
            className="rounded-md bg-accent-blue px-3 py-1.5 text-xs font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
          >
            {busy ? "Decrypting…" : "Reveal"}
          </button>
        )}
      </div>

      <div className="mt-3 text-sm">
        {isZero ? (
          <span className="tabular-nums">0 {symbol ?? ""}</span>
        ) : busy ? (
          <span className="block">
            <span className="text-[#7A8699]">Confirm in your wallet, then decrypting…</span>
            <SignatureHint active={busy} />
          </span>
        ) : error ? (
          <span className="flex items-center gap-2">
            <span className="text-rose-300" title={collectText(error)}>
              {revealErrorMessage(error)}
            </span>
            <button type="button" onClick={onReveal} className="text-xs text-accent-blue hover:underline">
              Retry
            </button>
          </span>
        ) : cleartext !== undefined ? (
          <span className="tabular-nums text-cyan-300">
            {formatClear(cleartext, decimals)} {symbol ?? ""}
          </span>
        ) : (
          <span className="font-mono tracking-widest text-[#7A8699]">••••••••</span>
        )}
      </div>
    </div>
  );
}

/** Paste any address and decrypt its balance if it's a valid ERC-7984 token. */
function PasteDecrypt() {
  const [input, setInput] = useState("");
  const valid = isAddress(input);
  const isConfidential = useIsConfidential(
    valid ? (input as Address) : ZERO_ADDRESS,
    { enabled: valid },
  );

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[#7A8699]">Any ERC-7984 address</label>
      <input
        spellCheck={false}
        placeholder="0x…"
        value={input}
        onChange={(e) => setInput(e.target.value.trim())}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-accent-blue/60"
      />
      {input.length > 0 && !valid && <p className="mt-2 text-xs text-rose-300">Not a valid address.</p>}
      {valid && isConfidential.isLoading && <p className="mt-2 text-xs text-[#7A8699]">Checking interface…</p>}
      {valid && isConfidential.isError && (
        <p className="mt-2 text-xs text-rose-300">Could not check token interface. Check your connection and try again.</p>
      )}
      {valid && isConfidential.data === false && (
        <p className="mt-2 text-xs text-rose-300">This address is not an ERC-7984 confidential token.</p>
      )}
      {valid && isConfidential.data === true && (
        <div className="mt-3">
          <DecryptRow tokenAddress={input as Address} />
        </div>
      )}
    </div>
  );
}

/**
 * Probes one registry token for a non-zero confidential balance. Renders a
 * decrypt row only when the wallet actually holds the token, so the auto-detect
 * list surfaces just the tokens worth revealing. Reads share react-query's cache
 * with the rows below, so this adds no extra RPC traffic.
 */
function DetectRow({ row }: { row: RegistryRow }) {
  const { address } = useAccount();
  const balance = useConfidentialBalance({ tokenAddress: row.confidentialTokenAddress }, { enabled: Boolean(address) });

  if (balance.isLoading) {
    return <div className="h-12 animate-pulse rounded-lg bg-white/5" />;
  }
  if (balance.data === undefined || balance.data === 0n) return null;

  return (
    <DecryptRow
      tokenAddress={row.confidentialTokenAddress}
      symbol={row.confidential.symbol}
      knownDecimals={row.confidential.decimals}
    />
  );
}

/**
 * Best-effort auto-detect: scan every registry token for a balance the wallet
 * holds, surfacing them as ready-to-reveal rows. Anything outside the registry
 * is covered by the paste-an-address fallback below. Gated behind a button so we
 * don't fan out balance reads until the user asks.
 */
function AutoDetect({ rows, excludeAddress }: { rows: RegistryRow[]; excludeAddress?: Address }) {
  const [scanning, setScanning] = useState(false);

  // The selected registry token already has its own row below — don't list it
  // twice. Everything else the wallet holds surfaces here.
  const scanRows = rows.filter((r) => r.confidentialTokenAddress !== excludeAddress);

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-wider text-[#7A8699]">Your other tokens</label>
        <button
          type="button"
          onClick={() => setScanning((s) => !s)}
          className="rounded-md bg-white/5 px-3 py-1 text-xs text-[#94A2B8] ring-1 ring-white/10 hover:bg-white/10"
        >
          {scanning ? "Hide" : "Scan my balances"}
        </button>
      </div>
      {scanning && (
        <div className="mt-3 space-y-2">
          {scanRows.length === 0 ? (
            <p className="text-xs text-[#7A8699]">No other registry tokens on this network.</p>
          ) : (
            <>
              {scanRows.map((r) => (
                <DetectRow key={r.confidentialTokenAddress} row={r} />
              ))}
              <p className="text-xs text-[#7A8699]">
                Only tokens with a non-zero balance appear here. Holdings outside the registry? Paste the
                address below.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function DecryptPanel() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { validRows: rows } = useRegistryPairs();
  const [selectedConf, setSelectedConf] = useState<string | null>(null);

  const pair = useMemo(
    () => rows.find((r) => r.confidentialTokenAddress === selectedConf) ?? rows[0],
    [rows, selectedConf],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#7A8699]">
        Reveal your own ERC-7984 balance via EIP-712. The first reveal asks for one signature, then reuses the
        session.
      </p>
      <NetworkBanner />

      {!isConnected && (
        <button
          type="button"
          onClick={() => openConnectModal?.()}
          className="w-full rounded-pill bg-accent-blue px-3 py-3 text-sm font-semibold text-accent-blue-foreground shadow-float-blue transition hover:brightness-110"
        >
          Connect Wallet
        </button>
      )}

      <AutoDetect rows={rows} excludeAddress={pair?.confidentialTokenAddress} />

      {/* Registry token */}
      {pair && (
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs uppercase tracking-wider text-[#7A8699]">Registry token</label>
            <TokenSelect
              rows={rows}
              value={pair.confidentialTokenAddress}
              onChange={setSelectedConf}
              variant="confidential"
            />
          </div>
          <div className="mt-3">
            <DecryptRow
              tokenAddress={pair.confidentialTokenAddress}
              symbol={pair.confidential.symbol}
              knownDecimals={pair.confidential.decimals}
            />
          </div>
        </div>
      )}

      <div className="border-t border-white/5 pt-5">
        <PasteDecrypt />
      </div>
    </div>
  );
}

/** Post-mount gate so the SDK hooks only run inside the ZamaProvider context. */
export function DecryptCard() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return <div className="h-24 animate-pulse rounded-lg bg-white/5" />;
  }
  return <DecryptPanel />;
}
