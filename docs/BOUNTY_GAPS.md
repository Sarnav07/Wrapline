# Bounty Gap Report (refreshed)

Audited: 2026-06-22 against current codebase (refreshed same day).

## CHANGES SINCE PRIOR AUDIT

- **Live URL now present** — old report listed the live URL as a submission blocker (`_coming soon_`). `README.md:10` now reads `https://wrapline.vercel.app/`. Whether the deployment is actually live is UNVERIFIABLE FROM CODE, but the URL is documented.
- **README "Adding a pair" example fixed** — old report flagged a type mismatch (wrong field names, false "auto-resolved" claim). The README example now matches the real `CustomPair` type; metadata is correctly described as manually declared.
- **isConfidential.isError branch added** — old report listed this as a UX gap and error-handling gap. `DecryptCard.tsx:122-124` now renders an error message when `useIsConfidential` fails due to RPC error.
- **validRows filter implemented** — action panels now use `validRows` for pair selection; deprecated/invalid registry entries are hidden from wrap/unwrap/decrypt dropdowns. Previously all rows were used.
- **UnwrapCard confidential balance display added** — old report flagged the absence of a balance read in UnwrapCard. All six display states are now implemented at `UnwrapCard.tsx:298-317`.
- **Dual-chain registry view** — `useAllChainsPairs` in `lib/registry.ts` reads both Sepolia and Mainnet simultaneously via `useReadContract` with explicit `chainId`. `RegistryTable.tsx` now shows pairs from both networks at all times with Network badge (amber = Sepolia, violet = Mainnet). Closes the "Registry single-chain view" judging-score gap.
- **isValid indicator in RegistryTable** — `RegistryTable.tsx:PairRow` dims invalid rows (`opacity-50`) and shows a "deprecated" badge (rose-300) alongside the source badge when `row.isValid === false`. Closes the "No explicit isValid explanation in UI" gap.
- **Deployment script added** — `scripts/register-pair.sh` calls `registerConfidentialToken(address,address)` on the Wrappers Registry via Foundry `cast send`. README "Registering a new pair on-chain" section documents usage. Closes the "No deployment scripts directory" gap.
- **Cross-device unwrap recovery** — `UnwrapCard.tsx` now includes a collapsible "Recover unwrap from another device…" form. User pastes a tx hash + selects token → `savePendingUnshield` seeds local storage → `rescan()` → existing `ResumeEntry` handles finalization. Auto-detection across devices still not possible (indexedDB is local), but the gap is bridged for manual recovery.
- **Faucet mint cap handling** — `lib/erc20.ts:erc20CapAbi` probes `MAX_AMOUNT_PER_ADDRESS` + `mintedAmount` on-chain; `WrapCard.tsx` shows remaining mintable tokens and disables the faucet button at zero; `lib/errors.ts` adds cap-exceeded revert pattern before the generic revert catch.
- **CUSTOM_PAIRS populated** — `config/pairs.ts:45-103` now contains all 8 official Zama Sepolia cTokenMock pairs as a hardcoded safety net. Addresses verified via live `eth_call` to `getTokenConfidentialTokenPairs()` (selector `0xf63a0980`) on Sepolia. Dedup logic in `useRegistryPairs` + `useAllChainsPairs` silently ignores these when the on-chain registry returns the same `confidentialTokenAddress`. Closes the "cTokenMock coverage" submission blocker.

---

## SUBMISSION BLOCKERS

- **Live deployment reachability**: `README.md:10` cites `https://wrapline.vercel.app/` but whether the Vercel deployment is live and wallet-connectable is UNVERIFIABLE FROM CODE. Manual browser test required before submission.

- **Env vars set in Vercel**: `lib/wagmi.ts:5-6` reads `NEXT_PUBLIC_SEPOLIA_RPC_URL` and `NEXT_PUBLIC_MAINNET_RPC_URL`. If these are blank in Vercel, the app uses public default RPCs (acceptable for a demo) — but without them, the ZamaProvider relayer may not connect to Sepolia correctly. Must be verified in Vercel project settings.

- **cTokenMock coverage**: RESOLVED via `config/pairs.ts:45-103`. `CUSTOM_PAIRS` now contains all 8 official Zama Sepolia cTokenMock pairs (USDCMock, USDTMock, WETHMock, BRONMock, ZAMAMock, tGBPMock, XAUtMock, tGBP) with verified on-chain addresses. On-chain registry entries take precedence; custom entries are a silent fallback. Coverage is now guaranteed even if the on-chain registry is unavailable at runtime.

- **Demonstration video**: Non-code deliverable. Cannot be verified from repo. Required per bounty rules (max 3 min, real person, specific scenes).

- **X (Twitter) thread or article**: Non-code deliverable. Cannot be verified from repo. Required per bounty rules.

- **GitHub repo public visibility**: Remote is `https://github.com/Sarnav07/Wrapline`. Whether it is set to Public on GitHub cannot be confirmed from the local codebase.

---

## JUDGING-SCORE GAPS

All previous gaps in this section are now resolved or improved:

- **Registry single-chain view** — RESOLVED. `useAllChainsPairs` (`lib/registry.ts`) reads Sepolia + Mainnet simultaneously via wagmi `useReadContract` with per-call `chainId`. `RegistryTable.tsx` shows both networks with Network badge at all times, independent of connected wallet chain.

- **Faucet mint cap** — IMPROVED. `WrapCard.tsx` probes `MAX_AMOUNT_PER_ADDRESS` + `mintedAmount` via `erc20CapAbi`; shows remaining mintable, disables faucet at zero. `lib/errors.ts` handles cap-exceeded revert string with a clear message. Full cap enforcement remains on-chain; UI degrades gracefully if the cap function doesn't exist.

- **No deployment scripts directory** — RESOLVED. `scripts/register-pair.sh` wraps `cast send` to call `registerConfidentialToken(address,address)` on the Wrappers Registry. README.md "Registering a new pair on-chain" section documents usage with environment variable examples.

- **Cross-device unwrap resume** — IMPROVED. Manual recovery UI added to `UnwrapCard.tsx`: collapsible form accepts a tx hash + token selection → `savePendingUnshield` seeds local IndexedDB → `rescan()` → existing `ResumeEntry` drives finalization. Auto-detection across devices still not possible (IndexedDB is origin-local), but a user with their tx hash from Etherscan can resume from any device.

- **No explicit `isValid` explanation in UI** — RESOLVED. `RegistryTable.tsx:PairRow` applies `opacity-50` to the row and shows a rose-300 "deprecated" badge in the Source column when `row.isValid === false`. All current Sepolia pairs are `isValid: true` so this only fires for future deprecated pairs.

---

## NON-CODE TODOS

- [ ] Manually verify https://wrapline.vercel.app/ is live, wallet-connectable, and functional on Sepolia
- [ ] Check Vercel project settings: confirm `NEXT_PUBLIC_SEPOLIA_RPC_URL`, `NEXT_PUBLIC_MAINNET_RPC_URL`, and `NEXT_PUBLIC_WC_PROJECT_ID` are set
- [ ] Confirm https://github.com/Sarnav07/Wrapline is set to Public on GitHub
- [ ] Enumerate official Zama Sepolia cTokenMock addresses from Zama docs; cross-reference against what the live app shows; add any missing ones to `config/pairs.ts` CUSTOM_PAIRS with full metadata
- [ ] Record a max-3-minute demo video showing: registry browse (both networks), faucet claim, wrap (with approval step), EIP-712 decrypt, unwrap (3-step stepper), arbitrary ERC-7984 paste-decrypt, and how to add a new pair
- [ ] Publish an X thread or article introducing Wrapline; add the link to README.md
- [ ] Add the GitHub repo URL explicitly to README.md (currently absent from the README body text)

---

## REQUIREMENT-BY-REQUIREMENT TABLE

### Requirements

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Web dApp with publicly accessible live URL | UNVERIFIABLE FROM CODE | `README.md:10` — `https://wrapline.vercel.app/`; URL is documented but live reachability requires manual browser check |
| 2 | Support Sepolia — shield/unshield/decrypt must work | COVERED | `WrapCard.tsx:84` (`useShield`), `UnwrapCard.tsx:162` (`useUnshield`), `DecryptCard.tsx:53` (`useUserDecrypt`); all gated on connected chain via `lib/wagmi.ts:14` (Sepolia listed first) |
| 3 | Hybrid registry: onchain primary + local config overlay | COVERED | `lib/registry.ts:32,53-70` — `useListPairs` (onchain primary) merged with `customPairsForChain` (local overlay), deduped by lowercase confidential address |
| 4 | Every official cTokenMock listed in Sepolia Wrappers Registry docs | COVERED | `config/pairs.ts:45-103` — `CUSTOM_PAIRS` has all 8 official pairs as hardcoded fallback; addresses verified via live RPC call. On-chain registry still primary; dedup ensures no duplicates. |
| 5 | Wrap and unwrap for every registry pair | COVERED | `WrapCard.tsx:155-159`, `UnwrapCard.tsx:291-296` — dropdowns populated from `validRows` (all valid pairs from the active chain's registry); no pairs excluded from either action |
| 6 | User decryption for any ERC-7984 (paste-an-address or auto-detect) | COVERED | `DecryptCard.tsx:102-135` (`PasteDecrypt`) — any address, validates ERC-7984, then reveals. `DecryptCard.tsx:167-200` (`AutoDetect`) — scans registry tokens for non-zero balances |
| 7 | Documented process for adding new pairs (README, with example) | COVERED | `README.md:46-72` — two paths (onchain registration + local config); example matches real `CustomPair` type (`chainId`, `erc20Address`, `confidentialTokenAddress`, `underlying`, `confidential` fields); correct metadata-is-manual statement |
| 8 | Open source in a public GitHub repository | UNVERIFIABLE FROM CODE | Remote is `https://github.com/Sarnav07/Wrapline`; public visibility not confirmable from local repo |

### Topics to Cover

| # | Topic | Status | Evidence |
|---|-------|--------|----------|
| 1 | Reading onchain registry + rendering with token metadata | COVERED | `lib/registry.ts:32,35-51` — `useListPairs({ metadata: true })` fetches symbol/decimals/name/addresses; `RegistryTable.tsx:39-65` renders them with explorer links |
| 2 | Faucet interaction with official cTokenMocks on Sepolia | COVERED | `WrapCard.tsx:168-188` — `mint(address, amount)` via `erc20MintableAbi`; gated to Sepolia only; uses `FAUCET_AMOUNT = 1000` (`lib/erc20.ts:23`) |
| 3 | Wrap flow: approval → wrap → confirmation | COVERED | `WrapCard.tsx:68-84,124-139,226-246` — `useApproveUnderlying` → `useShield`; approval button shown when `needsApproval`; mainnet guarded by `useConfirm` modal; success message with confidential balance handle shown |
| 4 | Unwrap flow: ERC-7984 → ERC-20 with correct access-control | COVERED | `UnwrapCard.tsx:156-259` — `useUnshield` drives 3-step async flow (request → KMS public-decrypt → finalize); `Stepper` component shows progress; resume drawer for interrupted unwraps |
| 5 | EIP-712 user-decryption of ERC-7984 balances (any token) | COVERED | `DecryptCard.tsx:53-56` — `useUserDecrypt({ handles })` triggers EIP-712 on reveal; covers registry tokens and arbitrary paste-address tokens |
| 6 | Frontend integration with FHEVM relayer SDK / fhevmjs | COVERED | `app/app/providers.tsx:39-65` — `RelayerWeb` + `ViemSigner` + `ZamaProvider`; RPC override propagated to both wagmi transports and relayer |
| 7 | Sensible error handling: approval failure, insufficient balance, network mismatch, unsupported tokens | COVERED | See ERROR HANDLING DETAIL below |

### Submission Requirements

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | GitHub repo (public) + README covering live URL, networks, registry, adding pairs, deployment scripts | COVERED (content) / UNVERIFIABLE (public visibility) | README.md covers all content areas; `README.md:10,11,35-43,46-72` — live URL, networks, registry sourcing, adding pairs; `scripts/register-pair.sh` + README "Registering a new pair on-chain" section covers deployment scripts |
| 2 | Live deployment on Sepolia | UNVERIFIABLE FROM CODE | `README.md:10` — URL documented; reachability requires manual check |
| 3 | Demonstration video (max 3 min, real person, required scenes) | NOT COVERED | Non-code deliverable |
| 4 | X thread or article | NOT COVERED | Non-code deliverable |

---

## ERROR HANDLING DETAIL

### 1. Approval Failure (missing or failed ERC-20 approval)

**Pre-flight guard**: `WrapCard.tsx:118` — `needsApproval = allowance.data !== undefined && amountBig > 0n && allowance.data < amountBig`; UI shows Approve button instead of Wrap button; Wrap is unreachable until approved.

**On-chain revert catch**: `lib/errors.ts:46-48` — `/insufficient allowance|transfer amount exceeds allowance/` → "The wrapper isn't approved for this amount. Approve first, then wrap."

**User rejection catch**: `lib/errors.ts:34` — code `4001` or `/user rejected.../` → "You rejected the request in your wallet."

**Where it surfaces**: `WrapCard.tsx:245` — `<StatusLine label="Approving" ... error={approve.error} />` inline below the Approve button.

**Gap**: None significant.

### 2. Insufficient Balance (wrap more than wallet holds)

**Pre-flight guard**: `WrapCard.tsx:119-120` — `insufficient = balance.data !== undefined && amountBig > 0n && (balance.data as bigint) < amountBig`; `canWrap` is false when insufficient; Wrap button is disabled.

**Inline warning**: `WrapCard.tsx:219-224` — rose-300 paragraph showing current balance and "Use the faucet above" hint on Sepolia.

**On-chain revert catch**: `lib/errors.ts:50-51` — `/transfer amount exceeds balance|exceeds balance|insufficient balance|burn amount exceeds/` → "Insufficient balance for this amount."

**Where it surfaces**: `WrapCard.tsx:246` — `<StatusLine label="Wrapping" ... error={shield.error} />`.

**Gap**: None significant; the UI guard prevents most on-chain paths from being reached.

### 3. Network Mismatch (wallet on wrong chain)

**Banner guard**: `NetworkBanner.tsx:6-19` — any chain not in `[sepolia.id, mainnet.id]` triggers amber banner with one-click switches, rendered inside WrapCard, UnwrapCard, and DecryptCard.

**Transaction-level catch**: `lib/errors.ts:38-39` — `/chain mismatch|does not match the target chain|chain "?\d+"? does not|wrong network/` → "Your wallet is on the wrong network. Switch networks and try again."

**Faucet gate**: `WrapCard.tsx:168,187` — faucet button hidden on mainnet; replaced with "The faucet is Sepolia-only" explanation.

**Gap**: RESOLVED. `WrapCard.tsx` now renders an amber inline banner with a "Switch to Sepolia" button when `isMainnet` (not just plain text). Unsupported-chain users still get the `NetworkBanner` at the top of the card + plain text in the faucet section (no double-banner).

### 4. Unsupported Token Paste (address is not ERC-7984)

**ZERO_ADDRESS guard**: `DecryptCard.tsx:105-108` — `useIsConfidential(valid ? (input as Address) : ZERO_ADDRESS, { enabled: valid })` — `ZERO_ADDRESS` passed when input is empty or invalid; hook is disabled (`enabled: valid`) so no spurious RPC call.

**False result**: `DecryptCard.tsx:125-127` — `isConfidential.data === false` → "This address is not an ERC-7984 confidential token." in rose-300.

**RPC error**: `DecryptCard.tsx:122-124` — `isConfidential.isError` → "Could not check token interface. Check your connection and try again."

**In-flight**: `DecryptCard.tsx:121` — `isConfidential.isLoading` → "Checking interface…"

**Gap**: None. All four states are handled.
