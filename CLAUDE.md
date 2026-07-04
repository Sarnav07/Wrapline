# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # dev server at localhost:3000
pnpm build      # production build (also type-checks)
pnpm lint       # eslint
pnpm tsc --noEmit  # type-check without building
```

No test suite. Verification is manual: run `pnpm dev`, connect a wallet on Sepolia, exercise the UI.

Environment: copy `.env.example` → `.env.local`. All vars are optional for local dev (injected wallets work without `NEXT_PUBLIC_WC_PROJECT_ID`; public RPCs are used as fallback).

## Architecture

**Two Next.js routes:**
- `/` — static marketing landing (`app/page.tsx` + `components/landing/`)
- `/app` — the dApp (`app/app/page.tsx`), wrapped in `app/app/providers.tsx`

**Provider stack** (`app/app/providers.tsx`):
```
WagmiProvider → QueryClientProvider → RainbowKitProvider → FheProvider (ZamaProvider)
```
`FheProvider` constructs a `RelayerWeb` (once, stable across renders) and a `ViemSigner` (rebuilt on wallet/chain change). **Do not swap to `WagmiSigner`** — it targets wagmi v3 and breaks the locked wagmi v2 + RainbowKit v2 stack.

**Registry data layer** (`lib/registry.ts`):

Two hooks with different scopes:

| Hook | Used by | Chain scope |
|------|---------|-------------|
| `useRegistryPairs()` | WrapCard, UnwrapCard, DecryptCard | Active wallet chain only (via `useListPairs` from SDK) |
| `useAllChainsPairs()` | RegistryTable | Sepolia + Mainnet simultaneously (via wagmi `useReadContract` with explicit `chainId`) |

Both merge on-chain results with `CUSTOM_PAIRS` from `config/pairs.ts`, deduped by lowercase `confidentialTokenAddress`. On-chain always wins. `useRegistryPairs` returns both `rows` (all) and `validRows` (filtered `isValid: true`) — action panels use `validRows`, RegistryTable uses `rows`.

**Action panels** (`components/`):
- `WrapCard` — faucet + ERC-20 approval + `useShield` (encrypt + wrap)
- `UnwrapCard` — `useUnshield` (3-step: request → KMS decrypt → finalize) + resume drawer + cross-device recovery paste
- `DecryptCard` — `useUserDecrypt` (EIP-712 balance reveal) for registry tokens and arbitrary paste-address ERC-7984s

**Error handling** — all panels funnel errors through `humanizeError()` in `lib/errors.ts`. Pattern-matches on flattened error text (walks `cause` chain up to 4 deep). Add new patterns before the generic revert catch.

**Config overlay** (`config/pairs.ts`) — `CUSTOM_PAIRS` contains all 8 official Zama Sepolia cTokenMock pairs as a hardcoded safety net. If a pair appears in the on-chain registry, its custom entry is silently ignored. Add new pairs here when they're not yet registered on-chain.

## Key constraints

- **wagmi 2.19.5 + viem 2 + RainbowKit 2** — versions are pinned by peer deps. Don't upgrade wagmi to v3.
- **`useListPairs` has no `chainId` param** — it reads only the active wallet chain. For cross-chain reads, use wagmi's `useReadContract`/`useReadContracts` with explicit `chainId` directly against `WRAPPERS_REGISTRY_ABI`.
- **`indexedDBStorage`** — pending unwrap tx hashes are stored in browser IndexedDB (origin-scoped). Cross-device resume requires manual tx hash input; auto-detection is not possible.
- **Faucet cap probe** — `erc20CapAbi` (`lib/erc20.ts`) calls `MAX_AMOUNT_PER_ADDRESS` + `mintedAmount`. Use `retry: false` — these functions may not exist on every cTokenMock; silent degradation is correct.
- **`ViemSigner` not `WagmiSigner`** — see provider stack note above.

## On-chain registration

```bash
PRIVATE_KEY=0x… ERC20_ADDRESS=0x… WRAPPER_ADDRESS=0x… bash scripts/register-pair.sh
# Mainnet: add CHAIN=mainnet
```

Requires Foundry (`cast`). Calls `registerConfidentialToken(address,address)` on the Wrappers Registry.

Registry addresses:
- Sepolia: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`
- Mainnet: `0xeb5015fF021DB115aCe010f23F55C2591059bBA0`
