"use client";

// FHE reveal client — the real user-decryption round-trip.
// This
// bypasses the @zama-fhe/react-sdk hook wrappers entirely: it lazy-loads the Zama
// relayer SDK in the browser, builds ONE EIP-712 userDecrypt message, takes a single
// signTypedData on an ethers signer, and calls instance.userDecrypt(...) directly —
// one signature, one round-trip, no react-query retry storm. Reads use a raw RPC URL;
// the wallet is used only to sign. A sealed handle stays sealed until the holder signs.

import type { BrowserProvider, TypedDataDomain, TypedDataField } from "ethers";
import { mainnet } from "wagmi/chains";
import { SEPOLIA_RPC, MAINNET_RPC } from "@/lib/wagmi";

type EIP712 = {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  message: Record<string, unknown>;
};

type FhevmInstance = {
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (publicKey: string, contracts: string[], start: number, days: number) => EIP712;
  userDecrypt: (
    handles: { handle: string; contractAddress: string }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contracts: string[],
    user: string,
    start: number,
    days: number,
  ) => Promise<Record<string, bigint | boolean | string>>;
};

// One instance per chainId — the SDK caches the session keypair internally, so a
// second reveal on the same chain never re-prompts for a signature.
const _instances = new Map<number, FhevmInstance>();

// Public Sepolia RPC fallback when NEXT_PUBLIC_SEPOLIA_RPC_URL is unset (a dedicated
// Alchemy/Infura/QuickNode URL is more reliable for the KMS reads).
const SEPOLIA_FALLBACK_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

async function getInstance(chainId: number): Promise<FhevmInstance> {
  const cached = _instances.get(chainId);
  if (cached) return cached;

  // dynamic import: relayer SDK is browser/WASM-heavy, keep it out of the server bundle
  const sdk = await import("@zama-fhe/relayer-sdk/web");
  await sdk.initSDK();

  // The *Config omits `network`; supply an RPC URL string. The SDK uses it to read chain
  // state (ACL/contract) — wallet signing happens separately on the ethers signer, so a raw
  // RPC is the robust choice. Cast at this single boundary since the SDK's config type is
  // internal and we model FhevmInstance structurally.
  let base: unknown;
  let rpc: string | undefined;
  if (chainId === mainnet.id) {
    base = sdk.MainnetConfig;
    rpc = MAINNET_RPC;
  } else {
    base = sdk.SepoliaConfig;
    rpc = SEPOLIA_RPC ?? SEPOLIA_FALLBACK_RPC;
  }
  const config = { ...(base as object), network: rpc } as Parameters<typeof sdk.createInstance>[0];
  const instance = (await sdk.createInstance(config)) as unknown as FhevmInstance;
  _instances.set(chainId, instance);
  return instance;
}

/** The empty ciphertext handle — an address that has never held a confidential balance. */
export const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

/**
 * Minimal ERC-7984 read ABI. `confidentialBalanceOf` returns the on-chain ciphertext
 * *handle* (bytes32) — the value userDecrypt needs. This is the source of truth for the
 * reveal handle; the react-SDK's `useConfidentialBalance` returns a decoded balance number,
 * which is NOT a valid handle and makes userDecrypt throw "Unknown FheType".
 */
export const CONFIDENTIAL_BALANCE_ABI = [
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "bytes32" }],
  },
] as const;

export type RevealResult = { cleartext: bigint; handle: string };

/**
 * Reveal a single euint64 handle to its authorized holder via the full EIP-712 userDecrypt
 * flow. Throws if the connected wallet is not authorized for the handle (the seal holds).
 */
export async function revealHandle(args: {
  handle: string;
  contractAddress: string;
  provider: BrowserProvider;
  chainId: number;
  durationDays?: number;
}): Promise<RevealResult> {
  const { handle, contractAddress, provider, chainId } = args;
  const durationDays = args.durationDays ?? 10;

  const instance = await getInstance(chainId);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const keypair = instance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const contracts = [contractAddress];

  const eip712 = instance.createEIP712(keypair.publicKey, contracts, startTimestamp, durationDays);
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message,
  );

  const result = await instance.userDecrypt(
    [{ handle, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace(/^0x/, ""),
    contracts,
    userAddress,
    startTimestamp,
    durationDays,
  );

  return { handle, cleartext: result[handle] as bigint };
}
