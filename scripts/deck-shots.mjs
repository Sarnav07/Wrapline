// Playwright capture of the current (pink) app UI for the pitch deck.
// Captures heading+console per tab + the registry table into <outDir>.
// Run against a PROD server (styled CSS): BASE=http://localhost:3100 node scripts/deck-shots.mjs <outDir>
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = process.argv[2] || "./deck-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 1000 },
  deviceScaleFactor: 2,
});

await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
const heading = page.getByRole("heading", { name: /Wrap, unwrap, and decrypt/i });
await heading.waitFor();
await page.getByRole("button", { name: "Decrypt" }).first().waitFor();
// Ensure the stylesheet actually applied (Satoshi, not fallback serif).
await page.waitForFunction(() => {
  const h = document.querySelector("h1");
  return h && getComputedStyle(h).fontFamily.toLowerCase().includes("satoshi");
});
await page.waitForTimeout(1500); // token logos + orbs settle

const consoleCard = page.locator("div.rounded-card").first();

async function shot(name, tab) {
  if (tab) {
    await page.getByRole("button", { name: tab, exact: true }).first().click();
    await page.waitForTimeout(800);
  }
  const hb = await heading.boundingBox();
  const cb = await consoleCard.boundingBox();
  const pad = 28;
  const clip = {
    x: Math.max(0, Math.min(hb.x, cb.x) - pad),
    y: Math.max(0, hb.y - pad),
    width: Math.max(hb.width, cb.width) + pad * 2,
    height: cb.y + cb.height - hb.y + pad * 2,
  };
  await page.screenshot({ path: `${OUT}/${name}.png`, clip });
  console.log("wrote", name, JSON.stringify(clip));
}

await shot("wrap", null);
await shot("unwrap", "Unwrap");
await shot("decrypt", "Decrypt");

// Registry table.
await page.locator("#registry").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.locator("#registry").screenshot({ path: `${OUT}/registry.png` });
console.log("wrote registry");

await browser.close();
