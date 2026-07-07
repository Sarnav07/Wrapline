/**
 * Turns the noisy errors thrown by wagmi / viem / the Zama SDK into a single
 * legible sentence. Every action panel runs its failure through here so the user
 * never sees a raw stack trace or a 600-character RPC blob. The mapping is
 * ordered most-specific first; the fallback is the error's short message.
 */

type Loose = { message?: string; shortMessage?: string; cause?: unknown; code?: number | string } | null | undefined;

function collectText(error: unknown, depth = 0): string {
  if (!error || depth > 4) return "";
  const e = error as Loose;
  const here = [e?.shortMessage, e?.message].filter(Boolean).join(" · ");
  const deeper = collectText(e?.cause, depth + 1);
  return [here, deeper].filter(Boolean).join(" || ");
}

function code(error: unknown): number | string | undefined {
  let e = error as Loose;
  for (let i = 0; i < 4 && e; i++) {
    if (e.code !== undefined) return e.code;
    e = e.cause as Loose;
  }
  return undefined;
}

/** Map a thrown error to one clean, user-facing sentence. */
export function humanizeError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  const text = collectText(error).toLowerCase();
  const c = code(error);

  // User dismissed the wallet prompt — not really an error.
  if (c === 4001 || /user rejected|user denied|rejected the request|request rejected|denied transaction/.test(text)) {
    return "You rejected the request in your wallet.";
  }
  // Wallet is on the wrong chain.
  if (/chain mismatch|does not match the target chain|chain "?\d+"? does not|wrong network/.test(text)) {
    return "Your wallet is on the wrong network. Switch networks and try again.";
  }
  // Not enough ETH to pay gas.
  if (/insufficient funds (for|to pay)|insufficient funds for gas|exceeds the balance of the account/.test(text)) {
    return "Not enough ETH to cover gas. Top up and try again.";
  }
  // ERC-20 allowance too low for the wrapper.
  if (/insufficient allowance|transfer amount exceeds allowance/.test(text)) {
    return "The wrapper isn't approved for this amount. Approve first, then wrap.";
  }
  // Token balance too low.
  if (/transfer amount exceeds balance|exceeds balance|insufficient balance|burn amount exceeds/.test(text)) {
    return "Insufficient balance for this amount.";
  }
  // Pasted / selected token isn't an ERC-7984.
  if (/not.*confidential|erc.?7984|unsupported token|not a confidential token/.test(text)) {
    return "This token isn't a supported ERC-7984 confidential token.";
  }
  // Relayer / KMS round-trip failure (decrypt + unwrap).
  if (/relayer|gateway|kms|decrypt(ion)? failed|failed to (user.?)?decrypt|decrypt(ing)? handles?|public.?decrypt/.test(text)) {
    return "The decryption service is flaky on Sepolia, this can take a few tries. Wait a moment and hit Retry.";
  }
  // Faucet mint cap hit.
  if (/mint cap|cap exceeded|exceeds.*cap|exceeds.*max.*mint|exceeds.*maximum.*mint|mint.*limit/.test(text)) {
    return "Faucet mint cap reached for this address. You've minted the maximum allowed test tokens.";
  }
  // Reverts without a decoded reason.
  if (/execution reverted|reverted with/.test(text)) {
    return "The transaction reverted on-chain. Check the amount and your balance.";
  }
  // Fall back to the shortest available message, trimmed.
  const e = error as Loose;
  const raw = (e?.shortMessage || e?.message || "").trim();
  if (!raw) return fallback;
  return raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;
}
