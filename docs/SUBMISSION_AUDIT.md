# Wrapline — Submission Audit

## 1. SUBMISSION BLOCKERS (must fix before July 7)

| # | Blocker | File(s) | Action |
|---|---------|---------|--------|
| 1 | **Live URL reachability unverified** | `README.md:10` (`https://wrapline.vercel.app/`) | **MANUAL CHECK REQUIRED** — open the URL, connect a wallet on Sepolia, confirm registry loads + a wrap works. Cannot verify from code. |
| 2 | **Vercel env vars unverified** | `lib/wagmi.ts:5-6,12`; `.env.example` lists all 3 | **MANUAL CHECK REQUIRED** — confirm `NEXT_PUBLIC_WC_PROJECT_ID`, `NEXT_PUBLIC_SEPOLIA_RPC_URL`, `NEXT_PUBLIC_MAINNET_RPC_URL` are set in Vercel project settings. App falls back to public RPC + dev WC id if blank (works for demo), but WalletConnect QR + reliable relayer need a real `WC_PROJECT_ID` and a custom RPC. |
| 3 | **GitHub repo visibility unverified** | remote `https://github.com/Sarnav07/Wrapline.git` | **MANUAL CHECK REQUIRED** — set repo to Public. Bounty requires open source. |
| 4 | **No demo video** | `README.md` (grep: zero hits for demo/video/youtube/loom) | Record max-3-min video (real person, no AI voice/video), then add the link to `README.md`. Required deliverable, currently absent. |
| 5 | **No X thread / article URL** | `README.md` (grep: zero hits for twitter/x.com/thread) | Publish X thread or article, add URL to `README.md`. Required deliverable, currently absent. |
| 6 | **GitHub repo URL not in README body** | `README.md` (URL only in git remote) | Add the repo URL explicitly to the README. Cheap, expected by judges. |

Note: `.env.local` exists locally (gitignored, correct) and `.env.example` ships all three
keys with blank values — that is the right pattern; no secret is committed.

## 2. REQUIREMENTS COVERAGE

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Web dApp with live URL | **PARTIAL** | `README.md:10` documents `https://wrapline.vercel.app/`. Reachability = manual check (blocker #1). Code is a deployable Next.js 14 app. |
| 2 | Sepolia shield/unshield/decrypt | **COVERED** | Shield: `WrapCard.tsx:107` `useShield`. Unshield: `UnwrapCard.tsx:162` `useUnshield` (3-step). Decrypt: `DecryptCard.tsx:53` `useUserDecrypt`. Default chain Sepolia (`lib/wagmi.ts:14`, `providers.tsx:73` `initialChain={sepolia}`). |
| 3 | Hybrid registry (onchain primary + local overlay) | **COVERED** | `lib/registry.ts:33` `useListPairs` (onchain primary) merged with `customPairsForChain` at `:55`, deduped by lowercase confidential address (`:54`). On-chain always wins. |
| 4 | All 8 official cTokenMocks | **COVERED** | `config/pairs.ts:45-105` — `CUSTOM_PAIRS` has USDCMock, USDTMock, WETHMock, BRONMock, ZAMAMock, tGBPMock, XAUtMock, tGBP. Hardcoded fallback; on-chain registry is primary and dedupes them out when present. |
| 5 | Wrap + unwrap for every pair | **COVERED** | Dropdowns from `validRows`: `WrapCard.tsx:40,178` (aliases `validRows` → `rows`), `UnwrapCard.tsx:351`. No pair excluded except `isValid:false` (correct — deprecated pairs shouldn't be wrappable). |
| 6 | User-decrypt any ERC-7984 (paste + auto-detect) | **COVERED** | Paste: `DecryptCard.tsx:102-135` `PasteDecrypt` validates via `useIsConfidential` then reveals. Auto-detect: `DecryptCard.tsx:167-201` `AutoDetect` scans registry tokens for non-zero balances. |
| 7 | Documented add-pair process w/ example | **COVERED** | `README.md:46-77` two paths (onchain `registerConfidentialToken` + local `config/pairs.ts`); example matches the real `CustomPair` type and states metadata is manual. Script: `scripts/register-pair.sh` + `README.md:115-130`. |
| 8 | Open-source public GitHub repo | **PARTIAL** | Remote set; public visibility = manual check (blocker #3). MIT license `README.md:142`. |

## 3. JUDGING CRITERIA GAPS

**Coverage — strong.** Dual-chain registry genuinely works: `useAllChainsPairs`
(`lib/registry.ts:130-185`) issues two `useReadContract` calls with explicit
`chainId: sepolia.id` / `mainnet.id` (`:135,141`), independent of wallet chain. Mainnet
pairs WILL render if the mainnet registry has any; CUSTOM_PAIRS only seeds Sepolia, so
Mainnet shows on-chain results only (honest — empty if none registered). No fix needed.

**Correctness — EIP-712 decrypt is fully wired.**
`DecryptCard.tsx`: `useConfidentialBalance:46` → `handleHex:48` → `useUserDecrypt:53`
gated `enabled: revealed && Boolean(handleHex)` → `cleartext:58`. Same chain in
`UnwrapCard.tsx:166-185`. Signature prompted on first reveal, session cached (comment
`:21-24`). **fhevmjs-not-initialized handling:** `providers.tsx:60` returns children
*without* `ZamaProvider` until `mounted && relayer && signer`; every card has a
post-mount `ready` gate (`WrapCard.tsx:306`, `UnwrapCard.tsx:432`, `DecryptCard.tsx:268`)
so SDK hooks never run before the provider exists. Relayer built once (`:39`), signer
rebuilt on wallet/chain change (`:51`). Solid.
- *Minor:* if `walletClient` is undefined at decrypt time the signature would fail, but
  cards gate on `isConnected`, so the path is unreachable in practice. No action.

**Error handling — all four paths covered.**
1. Approval failure: pre-flight `WrapCard.tsx:141` `needsApproval`; revert pattern
   `lib/errors.ts:46`; surfaced `WrapCard.tsx:289`.
2. Insufficient balance: guard `WrapCard.tsx:142`; inline `:263-268`; pattern
   `lib/errors.ts:50`.
3. Network mismatch: `NetworkBanner.tsx:14-46` (unsupported chains) + `WrapCard.tsx:218-229`
   (Mainnet faucet → amber "Switch to Sepolia"); pattern `lib/errors.ts:38`.
4. Unsupported token: `DecryptCard.tsx:121-127` (loading / error / false states);
   pattern `lib/errors.ts:54`.
Also handled: user-rejection (`:34`), gas (`:42`), relayer/KMS (`:58`), faucet cap (`:62`).

**Extensibility — strong.** Two documented add-pair paths; `register-pair.sh` parametric
on `CHAIN`; `CUSTOM_PAIRS` typed (`config/pairs.ts:23-29`). No fix.

**UX — strong, one nit.** Stepper for async unwrap (`UnwrapCard.tsx:43-69`), resume
drawer + cross-device recovery (`:287-338`), mainnet confirm modal, faucet cap display.
- *Nit:* `README.md:12` "Status: active development — M0 ... complete" reads as unfinished
  for a submission. Recommend updating to reflect shipped state. `README.md:139` references
  `docs/GAMEPLAN.md` in project structure — verify that file exists (git shows `docs/STATE.md`
  was deleted); a dangling doc link costs polish points.

**Code quality — clean.** Zero `TODO`/`FIXME`/`console.log`/`console.error` in
`app/`, `components/`, `lib/`, `config/`. Consistent error funnel via `humanizeError`.
Defensive fallbacks throughout (`registry.ts:38` metadata fallback, `erc20CapAbi`
`retry:false` degradation). No action.

**Production-readiness — good.** SSR-safe (`ssr:true` `wagmi.ts:19`, post-mount gates),
graceful RPC fallback, `allowFailure:true` on batched metadata reads (`registry.ts:149`).
Gaps are the manual ops items (blockers #1-3), not code.

`validRows` consistency check (explicitly requested): applied in **all three** panels —
`WrapCard.tsx:40` (`validRows: rows` alias, dropdown `:178`), `UnwrapCard.tsx:137,351`,
`DecryptCard.tsx:205,244`. `RegistryTable` deliberately uses unfiltered `rows` to show
deprecated pairs with a badge (`RegistryTable.tsx:62-66`). Consistent and correct.

## 4. NON-CODE TODOS

- [ ] Verify https://wrapline.vercel.app/ is live and wallet-connectable on Sepolia
- [ ] Confirm `NEXT_PUBLIC_SEPOLIA_RPC_URL` is set in Vercel project settings
- [ ] Confirm `NEXT_PUBLIC_MAINNET_RPC_URL` is set in Vercel project settings
- [ ] Confirm `NEXT_PUBLIC_WC_PROJECT_ID` is set in Vercel project settings
- [ ] Set GitHub repo https://github.com/Sarnav07/Wrapline to Public
- [ ] Record 3-min demo video (real person, no AI voice/video): registry browse, faucet claim, wrap w/ approval, EIP-712 decrypt, unwrap 3-step, arbitrary ERC-7984 paste-decrypt, how to add a pair
- [ ] Publish X thread or article introducing Wrapline; add URL to `README.md`
- [ ] Add GitHub repo URL explicitly to `README.md` body text

## 5. WHAT'S ACTUALLY DONE WELL

- **Dual-chain registry** — `lib/registry.ts:130-185`. Real per-chain `chainId` reads + batched metadata + dedup. Not faked.
- **Async unwrap w/ resume** — `UnwrapCard.tsx:236-275` checkpoints tx on submit; `ResumeEntry:72-130` + cross-device recovery `:295-338` finalize interrupted unwraps.
- **EIP-712 decrypt** — `DecryptCard.tsx:25-99` `DecryptRow`; reveal-gated, session-cached, on-chain decimals fallback `:38-44`.
- **Error humanizer** — `lib/errors.ts:28-74`. Walks `cause` chain depth 4, ordered most-specific-first, sane fallback.
- **FHE provider wiring** — `providers.tsx:30-66`. `ViemSigner` (not `WagmiSigner`) with documented rationale; relayer-once / signer-rebuilt memoization correct.
- **Hybrid registry merge** — `lib/registry.ts:35-71`. Onchain-primary, lowercase dedup, defensive metadata fallback.
- **Faucet cap probe** — `WrapCard.tsx:85-102` + `erc20CapAbi`. Optional functions, `retry:false`, silent degradation, disables button at zero.
- **Clean codebase** — no debug/TODO residue across all source dirs.

## 6. PRIORITY ORDER FOR REMAINING WORK

1. **[BLOCKER · QUICK]** Add GitHub repo URL to `README.md` body. (<5 min)
2. **[BLOCKER · QUICK]** Set GitHub repo to Public. (<5 min, manual)
3. **[BLOCKER · QUICK]** Verify live URL loads + Sepolia wrap works. (~15 min, manual)
4. **[BLOCKER · QUICK]** Verify 3 env vars set in Vercel. (~10 min, manual)
5. **[POLISH · QUICK]** Update `README.md:12` status line; verify `docs/GAMEPLAN.md` link or remove it. (~10 min)
6. **[BLOCKER · MEDIUM]** Record 3-min demo video; add link to README. (1-2 hrs)
7. **[BLOCKER · MEDIUM]** Publish X thread/article; add URL to README. (1-2 hrs)

No code blockers remain. Items 1-7 are docs + ops + media. The application meets every
code-level bounty requirement as verified above.
