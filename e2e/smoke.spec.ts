import { test, expect } from "@playwright/test";

/* ------------------------------------------------------------------ *
 * Wrapline pre-wallet smoke tests.
 *
 * These assert on visible content only, and never connect a wallet, so
 * they are deterministic in CI. Console noise from the Zama SDK /
 * WalletConnect is expected and ignored. Wallet-dependent flows
 * (faucet, wrap, unwrap, decrypt) live in the manual E2E_TESTING.md.
 * ------------------------------------------------------------------ */

test.describe("landing (/)", () => {
  test("hero + resource links render", async ({ page }) => {
    await page.goto("/");

    // Hero headline (split across a styled span).
    await expect(page.getByText("Confidential", { exact: false }).first()).toBeVisible();

    // Footer links point at the real destinations (exact names to avoid the
    // "View on GitHub" / "Read the docs" links).
    const github = page.getByRole("link", { name: "GitHub", exact: true });
    await expect(github).toHaveAttribute("href", "https://github.com/Sarnav07/Wrapline");

    const docs = page.getByRole("link", { name: "Docs", exact: true });
    await expect(docs).toHaveAttribute("href", "https://docs.zama.ai");
  });

  test("no 'Zama Developer Program' eyebrow anywhere", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Zama Developer Program")).toHaveCount(0);
  });
});

test.describe("app (/app)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
  });

  test("console shell renders with the three tabs + connect CTA", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Wrapline" }).first()).toBeVisible();

    // Segmented tabs.
    await expect(page.getByRole("button", { name: "Wrap", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unwrap", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Decrypt", exact: true })).toBeVisible();

    // Pre-wallet primary CTA (rendered because panels no longer gate on connect).
    await expect(page.getByRole("button", { name: "Connect Wallet" }).first()).toBeVisible();

    // No leftover program eyebrow.
    await expect(page.getByText("Zama Developer Program")).toHaveCount(0);
  });

  test("switching tabs swaps the active panel", async ({ page }) => {
    // Wrap panel default.
    await expect(page.getByText("You wrap")).toBeVisible();

    await page.getByRole("button", { name: "Unwrap", exact: true }).click();
    await expect(page.getByText("You unwrap")).toBeVisible();

    await page.getByRole("button", { name: "Decrypt", exact: true }).click();
    // Decrypt panel exposes the paste-any-address field.
    await expect(page.getByText("Any ERC-7984 address")).toBeVisible();
  });

  test("token pill opens the searchable token modal", async ({ page }) => {
    // The Wrap panel's token selector shows a default pair symbol.
    await page.getByRole("button", { name: /USDCMock/ }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Select a token")).toBeVisible();

    // Search filters the list.
    const search = dialog.getByPlaceholder("Search name or paste address");
    await search.fill("USDT");
    await expect(dialog.getByText(/USDTMock/).first()).toBeVisible();

    // Close.
    await dialog.getByRole("button", { name: "✕" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("feature bento + registry render below the console", async ({ page }) => {
    await expect(
      page.getByText("Everything the wrapper needs, on-chain."),
    ).toBeVisible();

    // Registry section heading (exact to avoid "One registry, two networks.";
    // first() since RegistryTable renders its own "Registry" heading too).
    await expect(page.getByRole("heading", { name: "Registry", exact: true }).first()).toBeVisible();
    await expect(page.getByText(/USDCMock/).first()).toBeVisible();
  });
});

test.describe("reduced motion", () => {
  test("app still fully renders with motion disabled", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/app");
    await expect(page.getByRole("button", { name: "Wrap", exact: true })).toBeVisible();
    await expect(page.getByText("You wrap")).toBeVisible();
  });
});
