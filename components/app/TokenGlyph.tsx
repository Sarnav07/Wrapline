import type { ComponentType, ReactNode } from "react";
import {
  TokenUSDC,
  TokenUSDT,
  TokenETH,
  TokenWBTC,
  TokenDAI,
} from "@web3icons/react";
import { CoinDisc } from "./TokenIcon";

/* ------------------------------------------------------------------ *
 * TokenGlyph — one source of truth for "registry symbol -> visual".
 * Real branded logos (via @web3icons/react) for the tokens the icon set
 * ships; the synthetic CoinDisc for everything else (mock / exotic
 * symbols like BRON, ZAMA, tGBP, XAUt, MTK have no canonical logo).
 * ------------------------------------------------------------------ */

type IconProps = {
  size?: number | string;
  variant?: "branded" | "mono" | "background";
  className?: string;
  fallback?: ReactNode;
};

// Cleaned ticker -> web3icons component. WETH has no icon in the set, so it
// maps to ETH (wrapped ether shares the ETH mark).
const LOGOS: Record<string, ComponentType<IconProps>> = {
  USDC: TokenUSDC,
  USDT: TokenUSDT,
  ETH: TokenETH,
  WETH: TokenETH,
  WBTC: TokenWBTC,
  BTC: TokenWBTC,
  DAI: TokenDAI,
};

/** Reduce a registry symbol to a base ticker:
 *  strip the `Mock` suffix, a leading confidential `c`, and exotic vault
 *  prefixes (`bbq`, `steak`). e.g. USDCMock->USDC, steakcUSDC->USDC. */
export function baseTicker(symbol: string): string {
  let s = symbol.replace(/Mock$/i, "");
  s = s.replace(/^(bbq|steak)/i, "");
  if (/^c[A-Z]/.test(s)) s = s.slice(1);
  return s.toUpperCase();
}

export function TokenGlyph({
  symbol,
  size = 40,
  className,
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const Logo = LOGOS[baseTicker(symbol)];
  if (Logo) {
    return (
      <Logo
        size={size}
        variant="branded"
        className={className}
        // Belt-and-suspenders: if a variant ever fails to load, show the disc.
        fallback={<CoinDisc symbol={symbol} size={size} />}
      />
    );
  }
  return <CoinDisc symbol={symbol} size={size} className={className} />;
}
