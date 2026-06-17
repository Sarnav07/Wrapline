/* ------------------------------------------------------------------ *
 * Monogram — the Wrapline mark: two curved "wrap" ribbons enclosing a
 * stem, reading as a flow/wrapping motion. Rendered in Deep Flow Blue
 * (or `currentColor` when `inherit`). Pure SVG, no client code.
 * ------------------------------------------------------------------ */
export function Monogram({
  size = 28,
  className,
  inherit = false,
}: {
  size?: number;
  className?: string;
  inherit?: boolean;
}) {
  const stroke = inherit ? "currentColor" : "var(--accent-blue)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* outer wrapping ribbon */}
      <path
        d="M7 9c0-2.2 1.8-4 4-4h10c2.2 0 4 1.8 4 4v3c0 2.2-1.8 4-4 4h-9"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* inner / lower ribbon, offset to read as flow */}
      <path
        d="M25 23c0 2.2-1.8 4-4 4H11c-2.2 0-4-1.8-4-4v-3c0-2.2 1.8-4 4-4h9"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
