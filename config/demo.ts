import { keccak256, toBytes, type Address } from "viem";

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
 * the number matches your demo script. Anything not listed falls back to a
 * deterministic pseudo-amount from `demoBalance`.
 */
export const DEMO_OVERRIDES: Record<string, string> = {
  // cUSDCMock: "1250.00",
};

/** The message the wallet signs on a demo reveal — a real personal_sign prompt. */
export function demoSignMessage(symbol?: string): string {
  return `Reveal my confidential ${symbol ?? "token"} balance on Wrapline`;
}

/**
 * Deterministic, plausible balance for (wallet, token). Same inputs always
 * yield the same value, so the Unwrap and Decrypt tabs agree for a given token.
 * Range ~100–5,000 units at 2 decimals, then scaled to the token's decimals.
 */
export function demoBalance(
  token: Address,
  wallet: Address,
  decimals: number,
  symbol?: string,
): bigint {
  if (symbol && DEMO_OVERRIDES[symbol]) {
    const [whole, frac = ""] = DEMO_OVERRIDES[symbol].split(".");
    const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
    return BigInt(whole + fracPadded || "0");
  }

  const seed = BigInt(keccak256(toBytes(`${wallet.toLowerCase()}:${token.toLowerCase()}`)));
  // Hundredths in [10_000, 500_000) → 100.00 .. 4_999.99 units.
  const hundredths = 10_000n + (seed % 490_000n);
  if (decimals >= 2) return hundredths * 10n ** BigInt(decimals - 2);
  // decimals 0 or 1: drop the fractional precision we can't represent.
  return hundredths / 10n ** BigInt(2 - decimals);
}
