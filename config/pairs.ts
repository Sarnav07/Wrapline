import type { Address } from "viem";
import { mainnet, sepolia } from "wagmi/chains";

/**
 * Token metadata shown in the registry table. For custom pairs these values are
 * declared by hand (we don't read them on-chain), so keep them in sync with the
 * deployed contracts.
 */
export type TokenMeta = {
  name: string;
  symbol: string;
  decimals: number;
};

/**
 * A custom ERC-20 ↔ ERC-7984 pair surfaced alongside the on-chain registry.
 *
 * The on-chain Wrappers Registry is the source of truth; this overlay exists for
 * pairs that aren't (yet) registered there — local deployments, dev tokens, or a
 * wrapper awaiting registration. A custom pair whose confidential address already
 * appears on-chain is ignored (the registry wins).
 */
export type CustomPair = {
  chainId: number;
  erc20Address: Address;
  confidentialTokenAddress: Address;
  underlying: TokenMeta;
  confidential: TokenMeta;
};

/**
 * Add a new pair here to make it show up in the app without any on-chain
 * registration. Example (delete or replace):
 *
 *   {
 *     chainId: sepolia.id,
 *     erc20Address: "0xYourErc20...",
 *     confidentialTokenAddress: "0xYourWrapper...",
 *     underlying: { name: "My Token", symbol: "MTK", decimals: 18 },
 *     confidential: { name: "Confidential My Token", symbol: "cMTK", decimals: 18 },
 *   },
 *
 * Supported chainIds: `sepolia.id` (11155111) and `mainnet.id` (1).
 */
export const CUSTOM_PAIRS: CustomPair[] = [];

/** Custom pairs declared for a given chain. */
export function customPairsForChain(chainId: number): CustomPair[] {
  return CUSTOM_PAIRS.filter((pair) => pair.chainId === chainId);
}

/** Chains the registry browser supports. */
export const REGISTRY_CHAINS = [sepolia, mainnet] as const;
