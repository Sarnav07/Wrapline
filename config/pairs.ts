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
export const CUSTOM_PAIRS: CustomPair[] = [
  // All 8 official Zama Sepolia cTokenMock pairs — hardcoded fallback if the
  // on-chain registry is unavailable. Dedup logic silently ignores these when
  // the same confidentialTokenAddress already appears in the on-chain results.
  {
    chainId: sepolia.id,
    erc20Address:             "0x9b5Cd13b8efBB58DC25A05Cf411D8056058aDFFF",
    confidentialTokenAddress: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
    underlying:   { name: "USDCMock",  symbol: "USDCMock",  decimals: 6  },
    confidential: { name: "cUSDCMock", symbol: "cUSDCMock", decimals: 6  },
  },
  {
    chainId: sepolia.id,
    erc20Address:             "0xa7Da08fAFDC9097cC0E7d4f113a61e31D7e8E9b0",
    confidentialTokenAddress: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
    underlying:   { name: "USDTMock",  symbol: "USDTMock",  decimals: 6  },
    confidential: { name: "cUSDTMock", symbol: "cUSDTMock", decimals: 6  },
  },
  {
    chainId: sepolia.id,
    erc20Address:             "0xFF54739B16576Fa5402f211D0b938469aB9A5f3F",
    confidentialTokenAddress: "0x46208622DA27d91db4f0393733C8BA082ed83158",
    underlying:   { name: "WETHMock",  symbol: "WETHMock",  decimals: 18 },
    confidential: { name: "cWETHMock", symbol: "cWETHMock", decimals: 18 },
  },
  {
    chainId: sepolia.id,
    erc20Address:             "0xFF021FB13Ca64E5354c62c954b949A88cFdeb25E",
    confidentialTokenAddress: "0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891",
    underlying:   { name: "BRONMock",  symbol: "BRONMock",  decimals: 18 },
    confidential: { name: "cBRONMock", symbol: "cBRONMock", decimals: 18 },
  },
  {
    chainId: sepolia.id,
    erc20Address:             "0x75355a85C6fb9DF5F0c80ff54e8747EEe9A0BF57",
    confidentialTokenAddress: "0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB",
    underlying:   { name: "ZAMAMock",  symbol: "ZAMAMock",  decimals: 18 },
    confidential: { name: "cZAMAMock", symbol: "cZAMAMock", decimals: 18 },
  },
  {
    chainId: sepolia.id,
    erc20Address:             "0x93c931278A2Aad1916783f952f94276eA5111442",
    confidentialTokenAddress: "0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC",
    underlying:   { name: "tGBPMock",  symbol: "tGBPMock",  decimals: 18 },
    confidential: { name: "ctGBPMock", symbol: "ctGBPMock", decimals: 18 },
  },
  {
    chainId: sepolia.id,
    erc20Address:             "0x24377ae4AA0C45ECEE71225007F17c5d423DD940",
    confidentialTokenAddress: "0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7",
    underlying:   { name: "XAUtMock",  symbol: "XAUtMock",  decimals: 6  },
    confidential: { name: "cXAUtMock", symbol: "cXAUtMock", decimals: 6  },
  },
  {
    chainId: sepolia.id,
    erc20Address:             "0xF6eF9AdB61a48E29e36bc873070a46a3D2667fF3",
    confidentialTokenAddress: "0x167DC962808B32CFFFc7e14B5018c0bE06A3A208",
    underlying:   { name: "tGBP",  symbol: "tGBP",  decimals: 18 },
    confidential: { name: "ctGBP", symbol: "ctGBP", decimals: 18 },
  },
];

/** Custom pairs declared for a given chain. */
export function customPairsForChain(chainId: number): CustomPair[] {
  return CUSTOM_PAIRS.filter((pair) => pair.chainId === chainId);
}

/** Chains the registry browser supports. */
export const REGISTRY_CHAINS = [sepolia, mainnet] as const;

/** On-chain Wrappers Registry contract address per supported chain. */
export const REGISTRY_ADDRESSES: Record<number, Address> = {
  [sepolia.id]: "0x2f0750Bbb0A246059d80e94c454586a7F27a128e",
  [mainnet.id]: "0xeb5015fF021DB115aCe010f23F55C2591059bBA0",
};

/** Minimal ABI for the Wrappers Registry — only what we call directly. */
export const WRAPPERS_REGISTRY_ABI = [
  {
    name: "getTokenConfidentialTokenPairs",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
] as const;
