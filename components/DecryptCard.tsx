"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { erc20Abi, formatUnits, isAddress, numberToHex, type Address } from "viem";
import { useConfidentialBalance, useIsConfidential, useUserDecrypt } from "@zama-fhe/react-sdk";
import { useRegistryPairs, type RegistryRow } from "@/lib/registry";
import { humanizeError } from "@/lib/errors";
import { NetworkBanner } from "./NetworkBanner";

function formatClear(value: bigint | boolean | `0x${string}`, decimals: number) {
  if (typeof value === "bigint") return formatUnits(value, decimals);
  return String(value);
}

/**
 * One decryptable token. Reads the connected wallet's encrypted balance handle,
 * and — only after the user clicks Reveal — runs EIP-712 user-decryption. The
 * holder can always decrypt their own balance (ACL granted on mint/transfer), so
 * no explicit allow step is needed here. The first reveal prompts a signature;
 * the SDK caches the session keypair, so later reveals don't re-prompt.
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
  const [revealed, setRevealed] = useState(false);

  // Fall back to reading decimals on-chain for pasted tokens.
  const decimalsRead = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "decimals",
    query: { enabled: knownDecimals === undefined },
  });
  const decimals = knownDecimals ?? decimalsRead.data ?? 0;

  const balance = useConfidentialBalance({ tokenAddress }, { enabled: Boolean(address) });
  const isZero = balance.data === 0n;
  const handleHex = useMemo(
    () => (balance.data !== undefined && balance.data !== 0n ? numberToHex(balance.data, { size: 32 }) : undefined),
    [balance.data],
  );

  const decrypt = useUserDecrypt(
    { handles: handleHex ? [{ handle: handleHex, contractAddress: tokenAddress }] : [] },
    { enabled: revealed && Boolean(handleHex) },
  );

  const cleartext = decrypt.data ? Object.values(decrypt.data)[0] : undefined;

  // Reset the reveal when the token changes.
  useEffect(() => setRevealed(false), [tokenAddress]);

  return (
    <div className="rounded-lg border border-white/10 bg-[#070A12] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-[#94A2B8]">
          {symbol ? `${symbol} · ` : ""}
          {tokenAddress.slice(0, 6)}…{tokenAddress.slice(-4)}
        </span>
        {!isZero && (
          <button
            type="button"
            disabled={balance.data === undefined || (revealed && decrypt.isFetching)}
            onClick={() => setRevealed(true)}
            className="rounded-md bg-accent-blue px-3 py-1.5 text-xs font-semibold text-accent-blue-foreground hover:brightness-95 disabled:opacity-50"
          >
            {revealed && decrypt.isFetching ? "Decrypting…" : "Reveal"}
          </button>
        )}
      </div>

      <div className="mt-3 text-sm">
        {isZero ? (
          <span className="tabular-nums">0 {symbol ?? ""}</span>
        ) : !revealed ? (
          <span className="font-mono tracking-widest text-[#7A8699]">••••••••</span>
        ) : decrypt.isError ? (
          <span className="text-rose-300">{humanizeError(decrypt.error, "Decryption failed")}</span>
        ) : cleartext !== undefined ? (
          <span className="tabular-nums text-emerald-300">
            {formatClear(cleartext, decimals)} {symbol ?? ""}
          </span>
        ) : (
          <span className="text-[#7A8699]">Awaiting signature…</span>
        )}
      </div>
    </div>
  );
}

/** Paste any address and decrypt its balance if it's a valid ERC-7984 token. */
function PasteDecrypt() {
  const [input, setInput] = useState("");
  const valid = isAddress(input);
  const isConfidential = useIsConfidential(input as Address, { enabled: valid });

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[#7A8699]">Any ERC-7984 address</label>
      <input
        spellCheck={false}
        placeholder="0x…"
        value={input}
        onChange={(e) => setInput(e.target.value.trim())}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[#070A12] px-3 py-2 font-mono text-sm"
      />
      {input.length > 0 && !valid && <p className="mt-2 text-xs text-rose-300">Not a valid address.</p>}
      {valid && isConfidential.isLoading && <p className="mt-2 text-xs text-[#7A8699]">Checking interface…</p>}
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
function AutoDetect({ rows }: { rows: RegistryRow[] }) {
  const [scanning, setScanning] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-wider text-[#7A8699]">Your tokens</label>
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
          {rows.length === 0 ? (
            <p className="text-xs text-[#7A8699]">No registry tokens on this network.</p>
          ) : (
            <>
              {rows.map((r) => (
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

function DecryptInner() {
  const { isConnected } = useAccount();
  const { rows } = useRegistryPairs();
  const [selectedConf, setSelectedConf] = useState<string | null>(null);

  const pair = useMemo(
    () => rows.find((r) => r.confidentialTokenAddress === selectedConf) ?? rows[0],
    [rows, selectedConf],
  );

  if (!isConnected) {
    return (
      <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
        <h2 className="font-semibold">Decrypt balance</h2>
        <p className="mt-3 text-sm text-[#7A8699]">Connect a wallet to decrypt your confidential balances.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
      <h2 className="font-semibold">Decrypt balance</h2>
      <p className="mt-1 text-xs text-[#7A8699]">
        Reveal your own ERC-7984 balance via EIP-712. The first reveal asks for one signature, then reuses the
        session.
      </p>
      <NetworkBanner />

      <div className="mt-4">
        <AutoDetect rows={rows} />
      </div>

      {/* Registry token */}
      {pair && (
        <div className="mt-4">
          <label className="block text-xs uppercase tracking-wider text-[#7A8699]">Registry token</label>
          <select
            value={pair.confidentialTokenAddress}
            onChange={(e) => setSelectedConf(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#070A12] px-3 py-2 text-sm"
          >
            {rows.map((r) => (
              <option key={r.confidentialTokenAddress} value={r.confidentialTokenAddress}>
                {r.confidential.symbol}
              </option>
            ))}
          </select>
          <div className="mt-3">
            <DecryptRow
              tokenAddress={pair.confidentialTokenAddress}
              symbol={pair.confidential.symbol}
              knownDecimals={pair.confidential.decimals}
            />
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-white/5 pt-5">
        <PasteDecrypt />
      </div>
    </section>
  );
}

/** Post-mount gate so the SDK hooks only run inside the ZamaProvider context. */
export function DecryptCard() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <section className="rounded-2xl border border-white/8 bg-[#0E1424] p-6">
        <h2 className="font-semibold">Decrypt balance</h2>
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-white/5" />
      </section>
    );
  }
  return <DecryptInner />;
}
