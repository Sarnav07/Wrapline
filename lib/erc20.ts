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
