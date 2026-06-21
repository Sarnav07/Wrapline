# Wrapline — Confidential Wrapper Registry

> The official **Zama Wrappers Registry**, turned into a usable product. Browse every
> ERC-20 ↔ ERC-7984 wrapper pair on **Sepolia** and **Ethereum mainnet**, wrap and unwrap
> any pair, decrypt any ERC-7984 balance via the **EIP-712 user-decryption** flow, and
> claim Sepolia test tokens from a built-in faucet.
>
> Built for the **Zama Developer Program — Season 3, Bounty Track**.

- **Live app:** https://wrapline.vercel.app/
- **Networks:** Ethereum Sepolia (testnet) · Ethereum Mainnet
- **Status:** active development — M0 (verification + scaffold) complete.

---

## Why

The official registry already lists canonical ERC-20 ↔ ERC-7984 pairs, but developers keep
spinning up their own test tokens and wrappers instead of using it. That fragments the
ecosystem — integrations don't compose and users end up with look-alike confidential assets.
Wrapline makes the canonical pairs the path of least resistance: easy to find, wrap, unwrap,
decrypt, and extend.

## Features

- **Browse the registry** — every pair read live from the onchain Wrappers Registry on both
  networks, with token metadata (symbol, name, decimals, addresses).
- **Wrap / unwrap** — ERC-20 → ERC-7984 and back, including the asynchronous unwrap flow
  (request → KMS public-decrypt → finalize) with a resumable pending state.
- **Decrypt any balance** — EIP-712 user-decryption for any ERC-7984 token your wallet holds,
  not just registry tokens (paste-an-address or auto-detect).
- **Sepolia faucet** — mint the official `cTokenMock` underlying ERC-20s, then wrap them.
- **Network switching** — Sepolia ↔ Mainnet; the faucet is testnet-only.

## How the registry is sourced (hybrid)

1. **Primary — onchain:** the deployed **Wrappers Registry** is the source of truth
   (`getTokenConfidentialTokenPairs()` enumerates all pairs).
   - Sepolia: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`
   - Mainnet: `0xeb5015fF021DB115aCe010f23F55C2591059bBA0`
2. **Overlay — local config:** a `config/pairs.ts` file declares custom or dev-only pairs that
   are merged on top of the onchain results (deduped by confidential-token address).

Token metadata, `rate()`, and `underlying()` are read at runtime — never hardcoded.

## Adding a new ERC-20 ↔ ERC-7984 pair

Two supported paths:

- **Canonical (recommended):** call `registerConfidentialToken(erc20Address, wrapperAddress)` on
  the deployed Wrappers Registry:
  - Sepolia: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`
  - Mainnet: `0xeb5015fF021DB115aCe010f23F55C2591059bBA0`

  The pair then appears in Wrapline (and every other registry consumer) automatically — no code
  change needed.

- **Local / dev:** add an entry to `config/pairs.ts`:
  ```ts
  // config/pairs.ts
  import { sepolia } from "wagmi/chains"; // or mainnet

  export const CUSTOM_PAIRS: CustomPair[] = [
    {
      chainId: sepolia.id,                                     // 11155111; use mainnet.id (1) for mainnet
      erc20Address: "0xYourUnderlying...",                     // ERC-20
      confidentialTokenAddress: "0xYourWrapper...",            // ERC-7984
      underlying: { name: "My Token",              symbol: "MTK",  decimals: 18 },
      confidential: { name: "Confidential My Token", symbol: "cMTK", decimals: 18 },
    },
  ];
  ```
  **Metadata (`name`, `symbol`, `decimals`) must be declared manually** — it is not resolved
  on-chain for local pairs. The app reads `underlying` and `confidential` directly from this
  config object. If the same `confidentialTokenAddress` also appears in the onchain registry,
  the onchain entry takes precedence and this entry is silently ignored.

## Tech stack

- **Next.js 14** (App Router, TypeScript) · **Tailwind**
- **wagmi 2 + viem 2 + RainbowKit 2** — wallet connection + network switching
- **@zama-fhe/react-sdk 3** + **@zama-fhe/sdk 3** + **@tanstack/react-query 5** — FHE encrypt /
  user-decrypt / public-decrypt, registry discovery, wrap/unwrap, balances
- Deployed on **Vercel**

> Note: the FHE signer is built with the SDK's `ViemSigner` (fed wagmi's live viem clients)
> rather than the `WagmiSigner` shim, which currently targets wagmi v3 and conflicts with
> RainbowKit's wagmi-v2 peer requirement.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in values (optional for local dev)
pnpm dev                     # http://localhost:3000
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_WC_PROJECT_ID` | for WalletConnect | RainbowKit / WalletConnect project id ([cloud.reown.com](https://cloud.reown.com)). Injected wallets (MetaMask) work without it. |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | optional | Custom Sepolia RPC (falls back to a public endpoint). |
| `NEXT_PUBLIC_MAINNET_RPC_URL` | optional | Custom Mainnet RPC (falls back to a public endpoint). |

### Scripts

```bash
pnpm dev      # dev server
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # eslint
```

### Registering a new pair on-chain

`scripts/register-pair.sh` calls `registerConfidentialToken` on the deployed Wrappers Registry via
[Foundry's `cast`](https://getfoundry.sh). Run it from the deployer account (the account that owns the wrapper contract):

```bash
PRIVATE_KEY=0x…      \
ERC20_ADDRESS=0x…    \
WRAPPER_ADDRESS=0x…  \
bash scripts/register-pair.sh

# Mainnet:
CHAIN=mainnet PRIVATE_KEY=0x… ERC20_ADDRESS=0x… WRAPPER_ADDRESS=0x… bash scripts/register-pair.sh
```

Once the tx confirms the pair appears in Wrapline automatically — no code change required.

## Project structure

```
app/            Next.js routes + providers (wagmi / RainbowKit / Zama)
lib/            wagmi config and shared helpers
config/         local custom-pair overlay (extensibility)
brand/          logo, banner, social assets (+ generator)
docs/           planning & technical reference (see docs/GAMEPLAN.md)
```

## License

MIT.
