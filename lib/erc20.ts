import { erc20Abi } from "viem";

/**
 * ERC-20 reads we need (balance, decimals, symbol) plus the cTokenMock faucet
 * `mint(address,uint256)`. The official Sepolia cTokenMocks expose an open mint;
 * there is no SDK hook for it, so we call it directly.
 */
export const erc20MintableAbi = [
  ...erc20Abi,
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

/** How many whole tokens the faucet mints per claim. */
export const FAUCET_AMOUNT = 1000;

/**
 * ABI fragments for optional cTokenMock cap functions. These may not exist on
 * every deployed contract — callers must use `retry: false` and degrade
 * gracefully on error.
 */
export const erc20CapAbi = [
  {
    type: "function",
    name: "MAX_AMOUNT_PER_ADDRESS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "mintedAmount",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;
