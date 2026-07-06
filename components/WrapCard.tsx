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
import { useConnectModal } from "@rainbow-me/rainbowkit";
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
import { TokenSelect } from "./app/TokenSelect";
import { TokenIcon } from "./app/TokenIcon";
import { SwapPanel } from "./app/SwapPanel";

function StatusLine({ label, pending, error }: { label: string; pending: boolean; error?: Error | null }) {
  if (pending) return <p className="mt-2 text-xs text-accent-blue">{label}…</p>;
  if (error) return <p className="mt-2 text-xs text-rose-300">{humanizeError(error)}</p>;
  return null;
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

export function WrapPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === sepolia.id;
  const isMainnet = chainId === mainnet.id;
  const { switchChain, isPending: switchPending } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
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

  if (!pair) {
    return <p className="text-sm text-[#7A8699]">No pairs available on this network.</p>;
  }

  const needsApproval = allowance.data !== undefined && amountBig > 0n && allowance.data < amountBig;
  const insufficient = balance.data !== undefined && amountBig > 0n && (balance.data as bigint) < amountBig;
  const canWrap = amountBig > 0n && !needsApproval && !insufficient;
  const balanceFmt = balance.data !== undefined ? formatUnits(balance.data as bigint, decimals) : "-";

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
    <div className="space-y-3">
      <NetworkBanner />
      {modal}

      {/* You wrap (underlying ERC-20) */}
      <SwapPanel
        label="You wrap"
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
            rows={rows}
            value={pair.confidentialTokenAddress}
            onChange={setSelectedConf}
            variant="underlying"
          />
        }
        footer={
          <>
            <span className="text-[#7A8699]">Balance: <span className="tabular-nums text-white/80">{balanceFmt}</span></span>
            {isSepolia && (
              <button
                type="button"
                disabled={!isConnected || faucet.isPending || faucetReceipt.isLoading || remainingMint === 0n}
                onClick={() =>
                  faucet.writeContract({
                    abi: erc20MintableAbi,
                    address: pair.erc20Address,
                    functionName: "mint",
                    args: [address!, parseUnits(String(FAUCET_AMOUNT), decimals)],
                  })
                }
                className="rounded-md bg-white/8 px-2 py-1 text-xs font-medium ring-1 ring-white/10 hover:bg-white/12 disabled:opacity-50"
              >
                {faucet.isPending || faucetReceipt.isLoading
                  ? "Minting…"
                  : remainingMint === 0n
                  ? "Cap reached"
                  : `Faucet +${FAUCET_AMOUNT}`}
              </button>
            )}
          </>
        }
      />

      {/* Direction arrow */}
      <div className="flex justify-center">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 text-white/60">↓</span>
      </div>

      {/* You receive (confidential ERC-7984, read-only) */}
      <SwapPanel
        label="You receive"
        input={
          <span className="block font-display text-4xl tabular-nums text-white/80 sm:text-5xl">
            {amount && Number(amount) > 0 ? amount : "0.0"}
          </span>
        }
        select={<TokenChip symbol={pair.confidential.symbol} />}
        footer={
          <span className="text-[#7A8699]">
            Wrapped 1:1 into {pair.confidential.symbol}; fractions below the wrapper&apos;s precision aren&apos;t minted.
          </span>
        }
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

      {/* Mainnet faucet notice / switch */}
      {isMainnet ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
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
      ) : !isSepolia ? (
        <p className="text-xs text-[#7A8699]">The faucet is Sepolia-only. Switch to Sepolia to claim test tokens.</p>
      ) : (
        remainingMint !== undefined && remainingMint > 0n && (
          <p className="text-xs text-[#7A8699]">
            Remaining mintable: {formatUnits(remainingMint, decimals)} {pair.underlying.symbol}
          </p>
        )
      )}
      <StatusLine label="Confirming faucet" pending={faucetReceipt.isLoading} error={faucet.error} />

      {insufficient && (
        <p className="text-xs text-rose-300">
          Insufficient {pair.underlying.symbol} balance. You have {balanceFmt}.
          {isSepolia ? " Use the faucet above." : ""}
        </p>
      )}

      {!isConnected ? (
        <button
          type="button"
          onClick={() => openConnectModal?.()}
          className="w-full rounded-pill bg-accent-blue px-3 py-3 text-sm font-semibold text-accent-blue-foreground shadow-float-blue transition hover:brightness-110"
        >
          Connect Wallet
        </button>
      ) : needsApproval ? (
        <button
          type="button"
          disabled={approve.isPending}
          onClick={() => approve.mutate({})}
          className="w-full rounded-pill bg-accent-blue px-3 py-3 text-sm font-semibold text-accent-blue-foreground shadow-float-blue transition hover:brightness-110 disabled:opacity-50"
        >
          {approve.isPending ? "Approving…" : `Approve ${pair.underlying.symbol}`}
        </button>
      ) : (
        <button
          type="button"
          disabled={!canWrap || shield.isPending}
          onClick={doWrap}
          className="w-full rounded-pill bg-accent-blue px-3 py-3 text-sm font-semibold text-accent-blue-foreground shadow-float-blue transition hover:brightness-110 disabled:opacity-50"
        >
          {shield.isPending ? "Wrapping…" : "Wrap"}
        </button>
      )}
      <StatusLine label="Approving" pending={approve.isPending} error={approve.error} />
      <StatusLine label="Wrapping" pending={shield.isPending} error={shield.error} />

      {shield.isSuccess && (
        <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300 ring-1 ring-emerald-400/30">
          Wrapped. Encrypted {pair.confidential.symbol} balance handle:{" "}
          <span className="font-mono">
            {confidentialBalance.data ? `0x${confidentialBalance.data.toString(16).slice(0, 12)}…` : "updating…"}
          </span>{" "}
          (decrypt it in the Decrypt tab).
        </p>
      )}
    </div>
  );
}

/** Post-mount gate so the SDK hooks only run inside the ZamaProvider context. */
export function WrapCard() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return <div className="h-24 animate-pulse rounded-lg bg-white/5" />;
  }
  return <WrapPanel />;
}
