# Wrapline — Demonstration Video Run-of-Show

A single end-to-end script for recording the bounty demo. It tells you what to **say**, what to
**show on the deck**, and what to **do on the live app** at every beat — plus how to start
everything and how to close.

**Deck:** `docs/Wrapline_Deck.pdf` (13 slides)
**App:** `http://localhost:3000/app` (or the live URL)
**Target length:** ~3.5–4 minutes.

> **Bounty rule — read this first.** The demonstration must be a **real person** presenting with
> a **real voice**. AI-generated video or AI voiceover will not be considered. Record yourself
> (webcam bubble or intro on camera) and narrate live.

---

## 1. Pre-flight checklist (do this ~5 min before you hit record)

- [ ] **Wallet funded on Sepolia** — the account you connect has Sepolia ETH for gas.
- [ ] **A prior wrap already exists** — do one wrap *before* recording so the Decrypt and Unwrap
      beats have a real confidential balance to reveal. (You'll do a fresh wrap on camera too;
      this pre-stage just guarantees Unwrap has something even if the on-camera wrap is slow.)
- [ ] **An arbitrary ERC-7984 address ready to paste** — a confidential token you hold that is
      *not* in the registry, for the last demo beat. Have it on the clipboard.
- [ ] **App running** — `pnpm dev` up, `http://localhost:3000/app` open, wallet **connected**,
      network = **Sepolia** (header dot is green, not amber).
- [ ] **Deck open fullscreen** — `docs/Wrapline_Deck.pdf` in a PDF viewer, presentation mode,
      slide 1 showing. (macOS: open in Preview → View → Slideshow, or Cmd+Shift+F.)
- [ ] **Browser zoom** ~110–125% so the swap console + registry read clearly on video.
- [ ] **Screen recorder + mic tested** — capture the browser window and the deck window (or
      alt-tab between them). Do a 5-second mic check.
- [ ] **Close noisy tabs / notifications** — no Slack/Mail popups mid-take.

Layout reminder for the app (`/app`, top → bottom):
**Connect button (header)** → hero → **Action console** with segmented **Wrap / Unwrap / Decrypt**
tabs → feature bento → **Registry** browser (`#registry`) → footer.
The **Faucet +1000** button lives in the **Wrap** tab. The **"Any ERC-7984 address"** paste
field lives in the **Decrypt** tab.

---

## 2. Run of show

Each beat lists **SLIDE** (deck), **SCREEN** (app), **SAY** (narration), **DO** (clicks), and
**WATCH-FOR** (the on-screen cue that the step worked). `<fill in>` = swap in your real value.

---

### B0 · Intro — the problem & the pitch  · ~30s
- **SLIDE:** 1 (Title) → 2 (Problem) → 3 (Solution).
- **SCREEN:** deck only.
- **SAY:** "Hi, I'm `<name>`. This is **Wrapline** — a confidential wrapper registry for
  Ethereum. Today, ERC-20 balances are fully public. Zama's FHE lets tokens hold *encrypted*
  balances as ERC-7984 confidential tokens — but there's no single place to discover the
  ERC-20 ↔ ERC-7984 pairs or to wrap, unwrap, and decrypt them. Wrapline is that place."
- **DO:** advance slides 1 → 2 → 3 as you speak.
- **WATCH-FOR:** land on slide 3 (Solution) before moving on.

### B1 · Demo overview — the six steps  · ~15s
- **SLIDE:** 4 (Demo overview, steps 01–06).
- **SCREEN:** deck only.
- **SAY:** "Everything I'm about to show is live on Sepolia. Six steps: browse the registry,
  claim test tokens from the faucet, wrap them, decrypt the confidential balance, unwrap back,
  and finally decrypt *any* confidential token — even one that isn't in the registry."
- **DO:** hold on slide 4 while listing the six.
- **WATCH-FOR:** the audience has the map before you switch to the app.

### B2 · Step 1/6 — Browse the registry  · ~30s
- **SLIDE:** 5 (demo·1/6).
- **SCREEN:** app → scroll to the **Registry** section (`#registry`).
- **SAY:** "Here's the registry. It's a **hybrid** source — the on-chain Wrappers Registry is
  primary, and every canonical Zama cToken pair is included as a local safety net. Each card
  shows the live name, symbol, decimals, and both addresses, pulled straight from chain. I can
  filter by network —" (click Sepolia / Mainnet) "— and it reads *both* chains at once."
- **DO:** scroll to `#registry`; click the **Sepolia** and **Mainnet** filter tabs; expand
  **show more** if collapsed.
- **WATCH-FOR:** cards re-filter and the counts update per network.

### B3 · Step 2/6 — Claim from the Sepolia faucet  · ~20s
- **SLIDE:** 6 (demo·2/6).
- **SCREEN:** app → **Wrap** tab.
- **SAY:** "To try it, I need test tokens. The **Wrap** tab has a built-in faucet for the
  cTokenMocks. One click mints me a thousand — and it's cap-aware, so it knows the per-address
  mint limit."
- **DO:** open the **Wrap** tab; pick a token (e.g. USDCMock); click **Faucet +1000**; confirm
  the tx in the wallet.
- **WATCH-FOR:** the **Balance** line ticks up after the mint confirms.

### B4 · Step 3/6 — Wrap a cTokenMock  · ~35s
- **SLIDE:** 7 (demo·3/6).
- **SCREEN:** app → **Wrap** tab.
- **SAY:** "Now I wrap. Wrapline handles the ERC-20 **approval**, then encrypts the amount with
  Zama's FHE and calls wrap — one-to-one into the confidential ERC-7984 token. Public ERC-20 in,
  encrypted balance out."
- **DO:** enter an amount; click **Approve** (confirm), then **Wrap** (confirm).
- **WATCH-FOR:** the approve→wrap steps complete and the confidential token (e.g. **cUSDCMock**)
  now shows a balance entry.

### B5 · Step 4/6 — Decrypt the ERC-7984 balance  · ~30s
- **SLIDE:** 8 (demo·4/6).
- **SCREEN:** app → **Decrypt** tab.
- **SAY:** "The balance is now encrypted on-chain — nobody can read it. But *I* can. In the
  **Decrypt** tab I sign a single **EIP-712** message to prove I'm the owner, and Wrapline reveals
  my balance to me only. The signature is cached for the session, so I sign once."
- **DO:** open the **Decrypt** tab; pick the token I just wrapped; click **Reveal**; sign the
  EIP-712 request in the wallet.
- **WATCH-FOR:** the masked balance flips to the real decrypted number.

### B6 · Step 5/6 — Unwrap back to ERC-20  · ~35s
- **SLIDE:** 9 (demo·5/6).
- **SCREEN:** app → **Unwrap** tab.
- **SAY:** "Unwrapping is asynchronous because it needs a threshold decryption from Zama's KMS.
  Three steps: I **request**, the KMS **decrypts**, and then I **finalize** to get my public
  ERC-20 back. And it's **resumable** — if I close the tab mid-flow, Wrapline picks it up from
  the pending request."
- **DO:** open the **Unwrap** tab; enter an amount; click through **request** → wait for KMS →
  **finalize**, confirming each tx.
- **WATCH-FOR:** the 3-step indicator advances and the ERC-20 balance returns on finalize.
- **FALLBACK (if KMS is slow):** "This waits on the KMS network, so it can take a moment on
  Sepolia — this is the resumable part; I could leave and come back and it'd continue."

### B7 · Step 6/6 — Decrypt any ERC-7984 (outside the registry)  · ~25s
- **SLIDE:** 10 (demo·6/6).
- **SCREEN:** app → **Decrypt** tab → **"Any ERC-7984 address"** field.
- **SAY:** "Finally — Wrapline isn't limited to its own registry. I paste **any** confidential
  token address, Wrapline resolves it, and I decrypt my balance in it. A general-purpose
  ERC-7984 decryptor, not a walled garden."
- **DO:** paste the pre-staged `<arbitrary ERC-7984 address>` into **Any ERC-7984 address**; let
  it resolve; click **Reveal**; sign.
- **WATCH-FOR:** the pasted token resolves to a name/symbol row and its balance decrypts.

### B8 · How a new pair is added  · ~25s
- **SLIDE:** 11 (Add a pair).
- **SCREEN:** deck only (no live cast — just explain).
- **SAY:** "Adding a new ERC-20 ↔ ERC-7984 pair is two paths. **On-chain**: run
  `scripts/register-pair.sh` with the two addresses — it calls `registerConfidentialToken` on the
  Wrappers Registry, and the app picks it up automatically. Or **locally**: add the pair to
  `config/pairs.ts`. Either way it flows into the same hybrid registry, and **on-chain always
  wins**."
- **DO:** hold on slide 11; point at the two code paths.
- **WATCH-FOR:** both paths (script + config) are clearly named.

### B9 · Close — criteria recap + thank you  · ~20s
- **SLIDE:** 12 (Judged on) → 13 (Thank you).
- **SCREEN:** deck only.
- **SAY:** "That's Wrapline end to end — coverage of every canonical pair, correct FHE wrap /
  unwrap / decrypt flows, extensible in one command, and a clean production UI. It's live at
  `<live URL>` and the code is at `<repo link>`. Thanks for watching."
- **DO:** advance 12 → 13; end on the thank-you slide.
- **WATCH-FOR:** stop recording on slide 13.

---

## 3. Timing budget

| Beat | Content | ~Time |
|------|---------|-------|
| B0 | Intro / problem / solution | 0:30 |
| B1 | Demo overview | 0:15 |
| B2 | Browse registry | 0:30 |
| B3 | Faucet | 0:20 |
| B4 | Wrap | 0:35 |
| B5 | Decrypt balance | 0:30 |
| B6 | Unwrap | 0:35 |
| B7 | Decrypt any ERC-7984 | 0:25 |
| B8 | Add a pair | 0:25 |
| B9 | Close | 0:20 |
| | **Total** | **~3:45** |

**Slow-transaction fallback lines** (keep talking while a tx confirms — dead air reads as broken):
- Faucet/approve/wrap pending: "While Sepolia confirms this — notice the amount was encrypted
  client-side before it ever hit the chain."
- Decrypt pending: "The EIP-712 signature proves ownership without exposing my key — reveal is
  to me only."
- Unwrap pending: use the B6 KMS fallback line above.

**If a live tx fails on camera:** don't fight it — cut to the matching deck slide (5–10), narrate
the step from the screenshot there, and move on. The deck mirrors every action.

---

## 4. Startup commands (appendix)

```bash
# 1. Frontend
pnpm install        # first time only
pnpm dev            # http://localhost:3000  → open /app
# then: click Connect, choose the wallet, switch network to Sepolia

# 2. Deck
open docs/Wrapline_Deck.pdf     # macOS → Preview → View → Slideshow (or Cmd+Shift+F)
```

Connect flow in-app: **Connect** button (top-right) → pick wallet → approve → confirm the header
network chip shows **Sepolia** with a green dot. If it's amber ("Unsupported"), switch networks in
the wallet.

---

## 5. Fill-in list (replace before recording)

- `<name>` — your name.
- `<arbitrary ERC-7984 address>` — a confidential token you hold, **not** in the registry.
- `<live URL>` — deployed app URL.
- `<repo link>` — public GitHub repo.
