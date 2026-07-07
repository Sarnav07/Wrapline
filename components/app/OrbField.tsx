import { TokenGlyph } from "./TokenGlyph";

/* ------------------------------------------------------------------ *
 * OrbField — the floating token field behind the action console, à la
 * the Uniswap swap landing. Coins use real token logos where available
 * (via TokenGlyph -> @web3icons/react) and fall back to synthetic discs
 * for mock/exotic symbols. Depth-of-field: near coins big/sharp/opaque,
 * far coins small/blurred/faint.
 *
 * Each coin is interactive: the container is pointer-events-none, but
 * every coin captures hover (pointer-events-auto) and on hover pops
 * bigger, snaps sharp, spins, and reveals its symbol label. Coins live
 * in the page gutters (off the card), so they never block the console.
 *
 * Positions come from a static deterministic array (no Math.random) so
 * server and client render identically. Drift reuses float-1..4 / bob;
 * the global prefers-reduced-motion block neutralizes the drift.
 * ------------------------------------------------------------------ */

// Depth buckets -> LITERAL Tailwind classes (so JIT emits them, and
// group-hover can override blur/opacity to snap a coin sharp on hover).
const BLUR = ["blur-0", "blur-[2px]", "blur-[4px]", "blur-[6px]"] as const;
const OPACITY = ["opacity-90", "opacity-70", "opacity-55", "opacity-40"] as const;

// [left%, top%, depthBucket 0..3, symbol, animation, delay(s), size(px)]
type Coin = [number, number, number, string, string, number, number];

const COINS: Coin[] = [
  // top band
  [10, 8, 1, "USDT", "animate-float-2", 0.4, 46],
  [24, 14, 3, "WETH", "animate-float-4", 1.1, 34],
  [34, 6, 3, "ZAMA", "animate-float-1", 1.9, 30],
  [50, 4, 3, "MTK", "animate-float-3", 0.7, 30],
  [66, 7, 3, "tGBP", "animate-float-2", 1.4, 32],
  [76, 12, 2, "BRON", "animate-float-1", 0.2, 40],
  [90, 9, 3, "XAUt", "animate-bob", 1.6, 34],
  // upper corners
  [4, 20, 0, "USDC", "animate-float-1", 0.0, 58],
  [18, 30, 2, "MTK", "animate-float-3", 1.2, 40],
  [95, 22, 1, "USDT", "animate-float-4", 0.9, 46],
  [82, 28, 3, "ZAMA", "animate-float-2", 1.7, 32],
  // mid-left gutter
  [2, 44, 1, "WETH", "animate-float-2", 0.6, 46],
  [10, 58, 0, "USDC", "animate-float-1", 1.0, 60],
  [6, 72, 2, "BRON", "animate-float-3", 0.3, 40],
  [20, 66, 3, "tGBP", "animate-bob", 2.0, 30],
  // mid-right gutter
  [97, 46, 1, "WBTC", "animate-float-3", 0.5, 44],
  [88, 60, 3, "MTK", "animate-float-1", 1.5, 32],
  [96, 70, 2, "USDC", "animate-float-4", 1.1, 40],
  // lower band
  [8, 88, 0, "ZAMA", "animate-float-2", 0.8, 48],
  [22, 92, 3, "USDT", "animate-float-1", 1.8, 30],
  [34, 86, 2, "WETH", "animate-float-4", 0.4, 40],
  [48, 94, 3, "tGBP", "animate-float-3", 1.3, 28],
  [62, 88, 2, "BRON", "animate-bob", 0.9, 40],
  [72, 93, 3, "XAUt", "animate-float-2", 2.1, 30],
  [84, 87, 1, "DAI", "animate-float-1", 0.6, 44],
  [93, 90, 3, "USDC", "animate-float-3", 1.5, 32],
  // extra density of the four headline tokens (USDC / USDT / DAI / WETH),
  // kept in the page gutters so they never overlap the console card.
  [14, 4, 2, "DAI", "animate-float-3", 0.5, 40],
  [40, 3, 3, "USDC", "animate-float-1", 1.0, 30],
  [58, 5, 3, "USDT", "animate-float-4", 1.6, 30],
  [70, 3, 2, "WETH", "animate-float-2", 0.3, 34],
  [86, 5, 3, "DAI", "animate-float-1", 1.3, 30],
  [3, 14, 1, "USDT", "animate-float-2", 0.8, 42],
  [97, 14, 2, "DAI", "animate-float-3", 0.4, 38],
  [2, 34, 2, "USDC", "animate-float-4", 1.1, 40],
  [98, 40, 1, "WETH", "animate-float-1", 0.6, 42],
  [4, 62, 3, "USDT", "animate-float-2", 1.4, 32],
  [95, 58, 2, "DAI", "animate-float-3", 0.7, 40],
  [2, 90, 1, "WETH", "animate-float-4", 0.2, 44],
  [16, 96, 3, "USDC", "animate-float-1", 1.7, 30],
  [40, 90, 2, "DAI", "animate-float-2", 0.9, 38],
  [56, 92, 3, "USDT", "animate-float-3", 1.2, 30],
  [78, 90, 2, "USDC", "animate-float-1", 0.5, 40],
  [97, 84, 1, "WETH", "animate-float-4", 1.0, 42],
];

// Soft defocused bokeh orbs that fill the margins around and above the card,
// matching the reference's out-of-focus color blobs. Purely decorative glow;
// the sharp TokenGlyph coins render on top.
// [left%, top%, size(px), color, blur(px), animation, delay(s), opacity]
const ORBS: Array<[number, number, number, string, number, string, number, number]> = [
  [12, 6, 200, "#f537a5", 52, "animate-float-1", 0.0, 0.3],
  [46, 2, 160, "#ff79cf", 46, "animate-float-3", 1.2, 0.24],
  [80, 8, 210, "#22c55e", 54, "animate-float-2", 0.6, 0.2],
  [3, 40, 190, "#5c0f45", 50, "animate-bob", 1.6, 0.32],
  [95, 34, 180, "#fbb8e4", 48, "animate-float-4", 0.4, 0.22],
  [6, 82, 170, "#f59e0b", 46, "animate-float-2", 2.0, 0.2],
  [92, 78, 200, "#ff79cf", 52, "animate-float-1", 1.1, 0.24],
  [70, 90, 150, "#f537a5", 44, "animate-bob", 0.8, 0.22],
];

export function OrbField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* soft bokeh layer (behind the coins) */}
      {ORBS.map(([left, top, size, color, blur, anim, delay, opacity], i) => (
        <span
          key={`o${i}`}
          className={`absolute rounded-full ${anim}`}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            background: color,
            opacity,
            filter: `blur(${blur}px)`,
            animationDelay: `${delay}s`,
          }}
        />
      ))}

      {COINS.map(([left, top, depth, symbol, anim, delay, size], i) => (
        <span
          key={i}
          className={`group pointer-events-auto absolute cursor-pointer ${anim}`}
          style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }}
        >
          {/* pop layer: scale + raise on hover */}
          <span className="relative block transition-transform duration-300 ease-out group-hover:z-40 group-hover:scale-[1.7] [perspective:600px]">
            {/* depth layer: blur/opacity buckets, cleared on hover */}
            <span
              className={`block ${BLUR[depth]} ${OPACITY[depth]} transition-[filter,opacity] duration-300 group-hover:blur-0 group-hover:opacity-100 group-hover:animate-coin-spin [transform-style:preserve-3d]`}
            >
              <TokenGlyph symbol={symbol} size={size} />
            </span>
            {/* symbol label, fades in on hover */}
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#17131E] px-2 py-0.5 font-mono text-[10px] text-white opacity-0 ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100">
              {symbol}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
