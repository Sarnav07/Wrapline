import { type Address } from "viem";

/**
 * Demo reveal mode.
 *
 * The Zama Sepolia relayer/KMS `userDecrypt` round-trip is unreliable and often
 * never returns, so a live balance reveal can't complete during a demo. When
 * DEMO_REVEAL is on, the Reveal buttons take a REAL wallet signature (MetaMask
 * opens and the user confirms) and then display a plausible, deterministic
 * balance instead of waiting on the dead KMS.
 *
 * This is an explicit, presentation-only fallback. It is env-reversible: set
 * `NEXT_PUBLIC_DEMO_REVEAL=false` in `.env.local` to restore the real
 * useAllow + useUserDecrypt path. Wrap / unwrap transactions are never affected.
 */
export const DEMO_REVEAL = process.env.NEXT_PUBLIC_DEMO_REVEAL !== "false";

/**
 * Pin exact amounts (in whole token units) for specific confidential symbols so
 * the number matches your demo script. Anything not listed (including
 * arbitrary paste-address ERC-7984s with no known symbol) falls back to the
 * flat `DEFAULT_DEMO_BALANCE` below.
 */
export const DEMO_OVERRIDES: Record<string, string> = {};

/** Shown for any ERC-7984 token that has no explicit entry in DEMO_OVERRIDES. */
export const DEFAULT_DEMO_BALANCE = "2450.00";

/** The message the wallet signs on a demo reveal — a real personal_sign prompt. */
export function demoSignMessage(symbol?: string): string {
  return `Reveal my confidential ${symbol ?? "token"} balance on Wrapline`;
}

/**
 * Plausible balance for (wallet, token). Same inputs always yield the same
 * value, so the Unwrap and Decrypt tabs agree for a given token.
 */
export function demoBalance(
  _token: Address,
  _wallet: Address,
  decimals: number,
  symbol?: string,
): bigint {
  const pinned = (symbol && DEMO_OVERRIDES[symbol]) || DEFAULT_DEMO_BALANCE;
  const [whole, frac = ""] = pinned.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole + fracPadded || "0");
}
