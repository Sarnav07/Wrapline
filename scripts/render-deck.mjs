// Render docs/deck.html -> docs/Wrapline_Deck.pdf (13 slides, 1280x720).
// node scripts/render-deck.mjs
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const html = resolve("docs/deck.html");
const out = resolve("docs/Wrapline_Deck.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
// Ensure webfonts (Anton/Caveat/Satoshi) are ready before printing.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.pdf({
  path: out,
  width: "1280px",
  height: "720px",
  printBackground: true,
  pageRanges: "1-13",
});
await browser.close();
console.log("wrote", out);
