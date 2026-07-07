import { defineConfig, devices } from "@playwright/test";

/* ------------------------------------------------------------------ *
 * Playwright config for Wrapline's pre-wallet smoke tests.
 *
 * The dApp is wallet-gated, so these tests only cover what renders
 * without a connected wallet (routes, console shell, tabs, token
 * modal, registry fallback, landing sections). The full wrap / unwrap
 * / decrypt flows require MetaMask on Sepolia and are covered by the
 * manual checklist in E2E_TESTING.md.
 *
 * The config auto-starts `next dev` on port 3100 and reuses an already
 * running server if one is up.
 * ------------------------------------------------------------------ */

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Use a production build: dev-mode compiles the heavy /app route (Zama SDK,
  // three, web3icons) on first hit and blows past test timeouts. `next start`
  // serves instantly after one build, so tests are stable.
  webServer: {
    command: `pnpm build && pnpm exec next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
