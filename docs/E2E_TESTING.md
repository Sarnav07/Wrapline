# Wrapline E2E Testing

Two layers:

1. **Automated smoke tests** (`e2e/smoke.spec.ts`, Playwright) cover the
   pre-wallet surface: routes load, the console shell + tabs, the token modal,
   the feature bento, and the registry fallback. Run with `pnpm test:e2e`.
2. **Manual test cases** (this document) cover the wallet flows, which need
   MetaMask on Sepolia and cannot be automated.

---

## Automated smoke tests

```bash
pnpm exec playwright install chromium   # once
pnpm test:e2e                           # auto-starts next dev on :3100
```

The config (`playwright.config.ts`) boots `next dev -p 3100` and reuses an
already running server. Console warnings from the Zama SDK / WalletConnect are
expected and ignored; the tests assert on visible content only.

Covered: landing hero + real GitHub/Docs links, no "Zama Developer Program"
eyebrow, `/app` three tabs + Connect Wallet CTA, tab switching, token modal open
+ search + close, feature bento + registry render, reduced-motion render.

---

## Prerequisites (manual flows)

- **MetaMask** (or any injected wallet) in the browser.
- Wallet on the **Sepolia** testnet with a little **Sepolia ETH** for gas
  (grab from a public Sepolia faucet).
- `.env.local` from `.env.example`. All vars are optional; for WalletConnect
  (mobile QR) set `NEXT_PUBLIC_WC_PROJECT_ID` (from cloud.reown.com). Injected
  wallets work without it.
- `pnpm install && pnpm dev`, open `http://localhost:3000`.

Registry / chain addresses (`config/pairs.ts`): Sepolia registry
`0x2f0750Bbb0A246059d80e94c454586a7F27a128e`, Mainnet
`0xeb5015fF021DB115aCe010f23F55C2591059bBA0`.

---

## Manual test cases

### TC1 — Landing page (`/`)
**Steps:** load `/`; scroll through every section; click the hero "Reveal" demo
pill; on the FHE globe section click the Sepolia / Ethereum toggle; click Footer
GitHub and Docs.
**Expected:** all sections render; Reveal flips `••••••` to `100.00` (blue) and
back on Hide; the globe toggle sits above the globe (does NOT overlap the ERC-20
rail pill) and switching Ethereum changes the ticket to the Mainnet label +
`0xeb50…bBA0` (Sepolia shows `0x2f07…128e`); GitHub opens
`github.com/Sarnav07/Wrapline`, Docs opens `docs.zama.ai`. No "Zama Developer
Program" text anywhere.

### TC2 — App load + connect (`/app`)
**Steps:** open `/app` before connecting; observe the console; click Connect
Wallet; approve in MetaMask; switch wallet to Sepolia if prompted.
**Expected:** the full swap console renders pre-connect (tabs, You wrap / You
receive panels, token pills, Connect Wallet CTA). Background coin field shows
real logos (USDC/USDT/WETH/WBTC/DAI) + synthetic discs for mock tokens; hovering
a coin pops it bigger, sharp, spinning, with a symbol label. After connect, the
header shows the network chip (green = supported Sepolia).

### TC3 — Faucet
**Steps:** on Wrap, pick a cTokenMock pair (e.g. USDCMock); click **Faucet
+1000**; confirm the mint tx.
**Expected:** tx submits; after it confirms, **Balance** updates by +1000. If the
token exposes a per-address cap, exceeding it surfaces a humanized error, not a
raw revert. On Mainnet the faucet section shows a "Switch to Sepolia" button.

### TC4 — Approve + Wrap (encrypt)
**Steps:** enter an amount ≤ balance; if **Approve <TOKEN>** shows, click and
confirm; then click **Wrap**; confirm.
**Expected:** allowance approves; wrap runs the SDK encrypt + shield; the You
receive side shows the 1:1 cTokenMock amount; note "Wrapped 1:1 … fractions below
the wrapper's precision aren't minted." A confidential balance now exists.

### TC5 — Unwrap (3-step async)
**Steps:** switch to **Unwrap**; pick the confidential token; enter an amount;
run the flow: **request → KMS public-decrypt → finalize**, confirming each
prompt. Mid-flow, reload the page.
**Expected:** each step advances with clear status; the pending unwrap is saved
(IndexedDB) and a **resume** drawer lets you continue after reload. The paste
recovery field accepts a tx hash for cross-device resume. On finalize, the
underlying ERC-20 returns to the wallet.

### TC6 — Decrypt (reveal balance)
**Steps:** switch to **Decrypt**; for a registry token click **Reveal**; sign the
EIP-712 prompt; also click **Scan my balances**; also paste an arbitrary
ERC-7984 address.
**Expected:** first reveal prompts one signature, then reuses the session (later
reveals do not re-prompt); the masked `••••••` resolves to the cleartext balance
(green). Scan lists only non-zero holdings. A non-ERC-7984 paste shows "not an
ERC-7984 confidential token".

### TC7 — Registry browser + dual-chain
**Steps:** scroll to **Registry**; read the table; compare against the feature
bento's live pair count.
**Expected:** the table lists pairs for **both** Sepolia and Mainnet (network
badges), merging on-chain results with the CUSTOM_PAIRS fallback; invalid/
deprecated pairs are marked. The bento's "N confidential pairs" counter matches
the valid-row count.

### TC8 — Error handling
**Steps:** reject a MetaMask prompt; try an action on an unsupported network;
attempt to wrap more than the balance.
**Expected:** each produces a readable message from `humanizeError`
(`lib/errors.ts`), never a raw hex revert; the UI stays usable (no crash).

### TC9 — Reduced motion
**Steps:** enable OS "reduce motion"; reload `/` and `/app`.
**Expected:** decorative drift (coins, orbs, globe rotation, marketing motion)
stops; every layout still renders fully and all controls work.

---

## Pass criteria

- `pnpm test:e2e` is green.
- TC1–TC9 pass on Sepolia with an injected wallet.
- `pnpm build` succeeds; `pnpm lint` and `pnpm tsc --noEmit` are clean.
