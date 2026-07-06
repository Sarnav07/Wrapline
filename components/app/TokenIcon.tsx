import { cx } from "@/components/landing/primitives";

/* ------------------------------------------------------------------ *
 * TokenIcon — Wrapline has no per-token logo assets (the registry is
 * text symbols), so we synthesize a deterministic coin: a brand-tinted
 * disc with the symbol's initials, colored by hashing the symbol.
 *
 * Default: on hover the coin pops (lift + scale) and spins on its Y
 * axis. With `popout`, hovering instead detaches a large coin wrapped
 * in a spinning orbit ring plus a pair label (used on the main token
 * selector, à la Uniswap).
 * ------------------------------------------------------------------ */

// Dark-enough tints so white initials always read.
const PALETTE = [
  "#006be4",
  "#6173ff",
  "#003168",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#e11d48",
  "#0ea5e9",
];

function tint(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** "cUSDCMock" → "US", "WETHMock" → "WE", "tGBP" → "TG". */
function initials(symbol: string): string {
  let s = symbol.replace(/Mock$/i, "");
  if (/^c[A-Z]/.test(s)) s = s.slice(1);
  return s.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
}

/** Deterministic brand tint for a symbol. Exported so the background coin
 * field colors its discs identically to the ones in the card. */
export function coinTint(symbol: string): string {
  return tint(symbol);
}

/** The plain disc (no interaction) — reused at any size, in the card and in
 * the background coin field. */
export function CoinDisc({ symbol, size, color, className }: { symbol: string; size: number; color?: string; className?: string }) {
  return <Disc symbol={symbol} size={size} color={color ?? tint(symbol)} className={className} />;
}

/** The plain disc (no interaction) — reused at any size. */
function Disc({ symbol, size, color, className }: { symbol: string; size: number; color: string; className?: string }) {
  return (
    <span
      className={cx("grid place-items-center rounded-full font-display font-bold text-white [transform-style:preserve-3d]", className)}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.4),
        boxShadow: `0 2px 10px -2px ${color}80`,
      }}
    >
      {initials(symbol)}
    </span>
  );
}

export function TokenIcon({
  symbol,
  size = 28,
  className,
  popout = false,
  subLabel,
}: {
  symbol: string;
  size?: number;
  className?: string;
  /** Detach a large coin + orbit ring on hover (main selector only). */
  popout?: boolean;
  /** Secondary line under the symbol in the pop-out (e.g. the pair). */
  subLabel?: string;
}) {
  const color = tint(symbol);
  return (
    <span
      className={cx(
        "group/icon relative inline-grid place-items-center [perspective:600px]",
        popout && "animate-float",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* pop layer (in-place hover for small icons) */}
      <span className="transition-transform duration-300 ease-out group-hover/icon:-translate-y-0.5 group-hover/icon:scale-110">
        <span className="block group-hover/icon:animate-coin-spin">
          <Disc symbol={symbol} size={size} color={color} />
        </span>
      </span>

      {/* Large detached pop-out (main selector only) */}
      {popout && (
        <span className="pointer-events-none absolute bottom-full right-0 z-50 mb-3 flex origin-bottom-right scale-90 flex-col items-center opacity-0 transition-all duration-200 group-hover/icon:scale-100 group-hover/icon:opacity-100">
          <span className="relative grid h-28 w-28 place-items-center [perspective:600px]">
            {/* spinning orbit ring */}
            <span className="absolute inset-0 rounded-full border border-white/15 animate-[spin_6s_linear_infinite]">
              <span
                className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
              />
            </span>
            {/* large spinning coin */}
            <span className="animate-coin-spin [transform-style:preserve-3d]">
              <Disc symbol={symbol} size={72} color={color} />
            </span>
          </span>
          <span className="mt-2 whitespace-nowrap rounded-xl bg-[#0E1424]/90 px-3 py-1.5 text-center ring-1 ring-white/10 backdrop-blur-sm">
            <span className="block font-display text-sm font-semibold text-white">{symbol}</span>
            {subLabel && <span className="block font-mono text-[10px] text-[#7A8699]">{subLabel}</span>}
          </span>
        </span>
      )}
    </span>
  );
}
