# Wrapline — Feature State Report (refreshed)

Audited: 2026-06-22 against current codebase. Prior version at same path was overwritten.

## CHANGES SINCE PRIOR AUDIT

- **isConfidential.isError branch added** — old BOUNTY_GAPS.md listed this as missing; it now exists at `DecryptCard.tsx:122-124`.
- **README "Adding a pair" example fixed** — old BOUNTY_GAPS.md documented a type mismatch (`network:`, `erc20:`, `faucet:` fields, "Metadata is auto-resolved" false claim). All corrected; example now matches the real `CustomPair` type and states metadata must be declared manually.
- **README live URL populated** — old BOUNTY_GAPS.md listed the live URL as `_coming soon_`. README.md line 10 now reads `https://wrapline.vercel.app/`.
- **validRows filter implemented** — `lib/registry.ts:74` returns `validRows: rows.filter((r) => r.isValid)`. All action panels (WrapCard, UnwrapCard, DecryptCard) now use `validRows` for pair selection; RegistryTable uses unfiltered `rows`; pending-scan loop in UnwrapCard uses unfiltered `rows`. Old audit did not flag this; now confirmed correct throughout.
- **UnwrapCard confidential balance display added** — old BOUNTY_GAPS.md flagged the absence of a confidential balance read in UnwrapCard. `UnwrapCard.tsx:298-317` now shows all six states: loading, zero, revealed+decrypted, revealed+fetching ("Decrypting…"), unrevealed-with-handle (Reveal button), and no-handle (—).
- **ZERO_ADDRESS guard in PasteDecrypt** — `useIsConfidential` is called with `ZERO_ADDRESS` (not bare `input as Address`) when input is empty/invalid (`DecryptCard.tsx:105-108`).
- **Dual-chain registry view** — `useAllChainsPairs` (`lib/registry.ts`) reads both Sepolia and Mainnet simultaneously via wagmi `useReadContract` with explicit `chainId` per call. `RegistryTable.tsx` now shows all pairs from both networks at all times, independent of connected wallet chain. Network badge (amber = Sepolia, violet = Mainnet) added per row. Action panels (WrapCard, UnwrapCard, DecryptCard) still use `useRegistryPairs` (active-chain only via `useListPairs`).
- **isValid indicator in RegistryTable** — `RegistryTable.tsx:PairRow` applies `opacity-50` and shows a rose-300 "deprecated" badge when `row.isValid === false`. All current Sepolia pairs are `isValid: true`.
- **Deployment script added** — `scripts/register-pair.sh` wraps `cast send` to call `registerConfidentialToken(address,address)` on the Wrappers Registry. README "Registering a new pair on-chain" section documents usage with environment variable examples.
- **Cross-device unwrap recovery UI added** — `UnwrapCard.tsx` now includes a collapsible "Recover unwrap from another device…" form. User pastes a tx hash + selects token → `savePendingUnshield` seeds local IndexedDB → `rescan()` → existing `ResumeEntry` drives finalization. Automatic cross-device detection is still not possible (IndexedDB is origin-local), but manual recovery is now supported.
- **Faucet mint cap handling** — `lib/erc20.ts:erc20CapAbi` probes `MAX_AMOUNT_PER_ADDRESS` + `mintedAmount` on-chain. `WrapCard.tsx` shows remaining mintable tokens and disables the faucet button at zero. `lib/errors.ts` adds cap-exceeded revert pattern. Probing degrades silently if the cap function doesn't exist on a given token.
- **CUSTOM_PAIRS populated** — `config/pairs.ts` now contains all 8 official Zama Sepolia cTokenMock pairs as a hardcoded fallback. Addresses verified via live `eth_call` to `getTokenConfidentialTokenPairs()` on Sepolia. Dedup logic in `useRegistryPairs` and `useAllChainsPairs` silently ignores these when the same `confidentialTokenAddress` already appears in the on-chain registry results.

---

## DONE

- **Registry read — onchain SDK call**: `lib/registry.ts:32` — `useListPairs({ metadata: true, pageSize: 100 })` pulls the on-chain registry for the active chain; re-fetches on network switch.

- **Registry read — config overlay**: `lib/registry.ts:53-64` — `customPairsForChain(chainId)` appended after on-chain rows; custom pairs whose confidential address is already in the on-chain set are filtered out.

- **Registry read — dedup by confidential address**: `lib/registry.ts:53-55` — `seen` Set built from all on-chain `confidentialTokenAddress.toLowerCase()` values; custom array filtered against it before merge. Dedup key is lowercase confidential address.

- **Registry read — validRows filter**: `lib/registry.ts:74` — `validRows: rows.filter((r) => r.isValid)` returned alongside unfiltered `rows`.

- **Wrap flow — approval step**: `WrapCard.tsx:83,226-234` — `useApproveUnderlying` from `@zama-fhe/react-sdk` handles ERC-20 approval; Approve button shown when `needsApproval` is true.

- **Wrap flow — shield/encrypt step**: `WrapCard.tsx:84,139` — `useShield` from `@zama-fhe/react-sdk` encrypts amount client-side and submits the wrap tx. `shield.mutate({ amount: amountBig })` is the terminal call.

- **Wrap flow — mainnet confirmation modal**: `WrapCard.tsx:124-138` — `useConfirm` modal gates wrap on mainnet; only fires when `isMainnet`.

- **Wrap flow — pair selection from validRows**: `WrapCard.tsx:38` — `const { validRows: rows } = useRegistryPairs()` (alias); only valid pairs appear in the dropdown.

- **Wrap flow — post-wrap balance refresh**: `WrapCard.tsx:93-98` — on `shield.isSuccess`, `balance.refetch()`, `allowance.refetch()`, `confidentialBalance.refetch()` called.

- **Faucet — mint flow**: `WrapCard.tsx:172-185` — `useWriteContract` calls `mint(address, amount)` on `pair.erc20Address` via `erc20MintableAbi`; `useWaitForTransactionReceipt` waits for confirmation; balance is refetched on success.

- **Faucet — Sepolia gate**: `WrapCard.tsx:34,168-188` — `isSepolia = chainId === sepolia.id`; faucet button only rendered on Sepolia; replaced with a text explanation on mainnet.

- **Faucet — mainnet tiny-amount helpers**: `WrapCard.tsx:204-218` — 0.001 and 0.01 quick-fill buttons shown on mainnet only, reducing risk of wrapping large real-money amounts.

- **Unwrap flow — 3-step async path**: `UnwrapCard.tsx:237-259` — `unshield.mutate({ amount, onUnwrapSubmitted, onFinalizing, onFinalizeSubmitted })` drives the full flow; stage machine `idle → unwrapping → finalizing → submitted → done/error`.

- **Unwrap flow — mid-flow persistence**: `UnwrapCard.tsx:243-244` — `savePendingUnshield(storage, wrapper, txHash)` called inside `onUnwrapSubmitted` immediately after the unwrap tx hash is known; `storage = indexedDBStorage` persists across page refresh.

- **Unwrap flow — resume on reload**: `UnwrapCard.tsx:190-203` — on mount (and on `scanTick` bump) the component loops over `rows` calling `loadPendingUnshield`, collects interrupted unwraps, and renders `ResumeEntry` components.

- **Unwrap flow — resume execution**: `UnwrapCard.tsx:83` — `useResumeUnshield({ tokenAddress: wrapper, wrapperAddress: wrapper })` re-drives the finalize step from the saved tx hash; pending record cleared on success.

- **Unwrap flow — pair selection from validRows**: `UnwrapCard.tsx:141,291` — `validRows.find(...)` for active pair; select rendered with `validRows.map(...)`; unfiltered `rows` used only for the pending-scan loop.

- **Unwrap flow — confidential balance display (6 states)**: `UnwrapCard.tsx:298-317`:
  - isLoading: line 300
  - data===0n (zero): line 302
  - revealed+decrypted (cleartext): line 304-305
  - revealed+fetching ("Decrypting…"): line 309 (inside Reveal button label)
  - unrevealed-with-handle (Reveal button): lines 306-314
  - no-handle (—): line 316

- **EIP-712 decrypt — signing entry point**: `DecryptCard.tsx:53-56` — `useUserDecrypt({ handles: [...] }, { enabled: revealed && Boolean(handleHex) })` triggers EIP-712 on `revealed === true`.

- **EIP-712 decrypt — paste-address path**: `DecryptCard.tsx:102-135` — `PasteDecrypt` validates with `isAddress`, passes `ZERO_ADDRESS` (not bare input) when invalid (`line 106`), calls `useIsConfidential`, shows isLoading/isError/false/true states, renders `DecryptRow` only when confirmed ERC-7984.

- **EIP-712 decrypt — isError branch in PasteDecrypt**: `DecryptCard.tsx:122-124` — `{valid && isConfidential.isError && <p>Could not check token interface...</p>}` renders on RPC failure.

- **EIP-712 decrypt — on-chain decimals fallback for pasted tokens**: `DecryptCard.tsx:38-44` — `useReadContract({ ..., functionName: "decimals", query: { enabled: knownDecimals === undefined } })` fires when no registry decimals are known.

- **EIP-712 decrypt — auto-detect path**: `DecryptCard.tsx:167-200` — `AutoDetect` + `DetectRow`: scans registry tokens via `useConfidentialBalance`, surfaces only non-zero-balance tokens as DecryptRow instances.

- **EIP-712 decrypt — uses validRows**: `DecryptCard.tsx:205` — `const { validRows: rows } = useRegistryPairs()` (alias); auto-detect and registry-token select use only valid pairs.

- **Network switching — unsupported chain banner**: `NetworkBanner.tsx:6-19` — only `[sepolia.id, mainnet.id]` supported; any other chainId shows amber banner with one-click switch to Sepolia or Mainnet.

- **Network switching — RPC env var wiring**: `lib/wagmi.ts:5-6,16-17` — `http(SEPOLIA_RPC)` / `http(MAINNET_RPC)`; if undefined or empty string, wagmi/viem falls back to the chain's public default RPC.

- **Network switching — relayer RPC override**: `app/app/providers.tsx:44-45` — `(SEPOLIA_RPC ? { network: SEPOLIA_RPC } : {})` spread into relayer transport; blank env var means no override (SDK uses its own default).

- **Wallet/FHE signer — ViemSigner**: `app/app/providers.tsx:51-58` — `new ViemSigner({ publicClient, walletClient, ethereum })` created inside `useMemo`; re-creates on wallet client or chain change.

- **Wallet/FHE signer — no WagmiSigner code**: `app/app/providers.tsx:29` — a comment explains why WagmiSigner was not used; no WagmiSigner import or call anywhere in the codebase.

- **Wallet/FHE signer — wagmi v2**: `package.json:23` — `"wagmi": "^2.19.5"`; compatible with RainbowKit `^2.2.11` and @zama-fhe/react-sdk `^3.0.1`.

- **RegistryTable — dual-chain via useAllChainsPairs**: `RegistryTable.tsx:6,83` — uses `useAllChainsPairs` (not `useRegistryPairs`); reads Sepolia + Mainnet simultaneously via wagmi `useReadContract` with explicit `chainId`. Shows all pairs from both networks at all times regardless of connected wallet chain. Network badge per row; `isValid: false` rows dimmed with "deprecated" badge.

- **Dual-chain registry hook — useAllChainsPairs**: `lib/registry.ts` — `useReadContract` × 2 (one per chain registry) + `useReadContracts` × 2 (symbol/decimals batch per chain). `buildMetadataContracts` + `zipRows` helpers assemble `RegistryRow[]` per chain. Custom pairs appended after dedup.

- **Error handling — humanizeError**: `lib/errors.ts:28-70` — covers user rejection, chain mismatch, insufficient ETH, insufficient allowance, insufficient balance, non-ERC-7984 token, relayer/KMS failure, cap-exceeded revert, and generic revert. Used by every action panel.

- **CUSTOM_PAIRS — 8 official Sepolia cTokenMock pairs**: `config/pairs.ts:45-103` — USDCMock (6 dec), USDTMock (6 dec), WETHMock (18 dec), BRONMock (18 dec), ZAMAMock (18 dec), tGBPMock (18 dec), XAUtMock (6 dec), tGBP (18 dec). All with `chainId: sepolia.id`. On-chain registry entries take precedence via dedup.

- **Deployment script**: `scripts/register-pair.sh` — `cast send` wrapper for `registerConfidentialToken(address,address)` on Sepolia (default) or Mainnet (`CHAIN=mainnet`). Requires `PRIVATE_KEY`, `ERC20_ADDRESS`, `WRAPPER_ADDRESS`. Documented in README.

- **Faucet — on-chain mint cap probe**: `WrapCard.tsx` — `useReadContract` calls `MAX_AMOUNT_PER_ADDRESS()` + `mintedAmount(address)` via `erc20CapAbi` (`lib/erc20.ts`); `remainingMint` computed as difference; faucet button disabled at zero; remaining shown below button. `retry: false` ensures silent degradation when cap functions absent.

---

## PARTIAL

- **Registry read — action panels single active chain only**: `lib/registry.ts:31-32` — `useListPairs` (used by `useRegistryPairs`, which drives WrapCard/UnwrapCard/DecryptCard) reads only the wallet's active chain. RegistryTable is now dual-chain via `useAllChainsPairs`; action panels are still active-chain only. User must switch wallet to the target chain before wrapping/unwrapping on that chain.

- **Cross-device unwrap resume**: `UnwrapCard.tsx` — manual recovery UI added: collapsible form accepts a tx hash + token selection → `savePendingUnshield` seeds local IndexedDB → `rescan()` → `ResumeEntry` drives finalization. Automatic cross-device detection is still not possible — `indexedDBStorage` is browser-local and origin-scoped; pending records don't transfer between devices or browsers.

---

## OPEN QUESTIONS

- **`useListPairs` data source**: Whether `@zama-fhe/react-sdk@3.0.1`'s `useListPairs` reads directly from the chain via RPC or hits a Zama-hosted indexer is not visible in this codebase. If an indexer is involved, uptime depends on Zama infrastructure.

- **`useShield` encryption internals**: The FHE encryption step happens inside the SDK (`@zama-fhe/sdk/viem`, `@zama-fhe/react-sdk`). Entry call is `shield.mutate({ amount: amountBig })` at `WrapCard.tsx:139`; the exact cipher-text construction is in node_modules.

- **`useUserDecrypt` EIP-712 message shape**: The domain separator, `primaryType`, and typed-data struct used for balance reveals are inside the SDK, not visible in this repo.

- **cTokenMock mint cap on-chain**: `WrapCard.tsx` now probes `MAX_AMOUNT_PER_ADDRESS()` + `mintedAmount(address)` via `erc20CapAbi`; if the functions don't exist on a given cTokenMock, the hooks fail silently (`retry: false`) and no cap UI is shown. Whether every deployed cTokenMock actually implements these functions is unverified from this codebase — the probe approach is safe either way.

- **`NEXT_PUBLIC_SEPOLIA_RPC_URL` and `NEXT_PUBLIC_MAINNET_RPC_URL` set in Vercel**: Env vars are correctly read in `lib/wagmi.ts:5-6` and consumed in transports + relayer, but whether they are actually populated in Vercel's dashboard is UNVERIFIABLE FROM CODE. Manual check required: open Vercel project settings → Environment Variables and confirm both are set.

- **Live URL reachability**: `README.md:10` states `https://wrapline.vercel.app/`. Whether the deployment is live and functional cannot be confirmed by reading the README alone. Requires manual browser check or `curl`.
