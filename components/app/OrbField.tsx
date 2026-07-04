/* ------------------------------------------------------------------ *
 * OrbField — decorative background of soft blurred orbs, à la Uniswap
 * but tinted to the Wrapline landing blues. Purely visual; the global
 * reduced-motion CSS neutralizes the drift. Sits behind page content.
 * ------------------------------------------------------------------ */

// [left%, top%, size(px), color, blur(px), animation, delay(s), opacity]
const ORBS: Array<[number, number, number, string, number, string, number, number]> = [
  [8, 20, 190, "#006be4", 44, "animate-float", 0, 0.26],
  [83, 14, 150, "#6173ff", 40, "animate-bob", 0.6, 0.24],
  [15, 66, 220, "#003168", 52, "animate-float", 1.4, 0.32],
  [86, 60, 200, "#006be4", 48, "animate-bob", 0.3, 0.24],
  [70, 82, 130, "#b5d6ff", 34, "animate-float", 2.1, 0.2],
  [30, 88, 150, "#6173ff", 40, "animate-bob", 1.1, 0.22],
  [52, 8, 110, "#b5d6ff", 30, "animate-float", 1.8, 0.18],
  [3, 44, 140, "#003168", 40, "animate-bob", 0.9, 0.28],
];

export function OrbField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {ORBS.map(([left, top, size, color, blur, anim, delay, opacity], i) => (
        <span
          key={i}
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
    </div>
  );
}
