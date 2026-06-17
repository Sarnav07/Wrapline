/* ------------------------------------------------------------------ *
 * WrapRain — the signature "type-rain" texture, cWrapline's take on
 * Fluxo's "TRANSFER" rain. Two layers:
 *   1) a bottom-weighted CASCADE of wide-spaced domain words that slowly
 *      drifts; a vertical mask makes it fade in at the top and pool
 *      (denser) toward the fold.
 *   2) a SCATTER field of single letters bobbing gently around the
 *      edges/top, like the word dispersing.
 * Pure CSS animation, deterministic layout (no random) -> hydration-safe,
 * works in server or client trees. Honors prefers-reduced-motion via the
 * global rule that flattens animation duration.
 * ------------------------------------------------------------------ */
const WORDS = ["WRAP", "UNWRAP", "SHIELD", "ENCRYPT", "DECRYPT"];

// One column "half" of cascade rows; rendered twice for a seamless -50% loop.
const ROWS = Array.from({ length: 11 }, (_, i) => WORDS[i % WORDS.length]);

// Single drifting letters — right- and edge-weighted, kept out of the
// vertical center so headline copy stays legible.
const SCATTER = [
  { ch: "W", top: "10%", left: "85%", size: 3.2, dur: 7.5, delay: 0 },
  { ch: "S", top: "21%", left: "68%", size: 2.0, dur: 9, delay: 1.2 },
  { ch: "E", top: "15%", left: "93%", size: 2.6, dur: 8, delay: 2.1 },
  { ch: "R", top: "31%", left: "79%", size: 1.7, dur: 10, delay: 0.6 },
  { ch: "N", top: "39%", left: "91%", size: 2.3, dur: 8.5, delay: 1.8 },
  { ch: "F", top: "45%", left: "73%", size: 1.6, dur: 11, delay: 0.3 },
  { ch: "P", top: "12%", left: "9%", size: 2.4, dur: 9.5, delay: 1.0 },
  { ch: "H", top: "27%", left: "4%", size: 1.8, dur: 10.5, delay: 2.4 },
  { ch: "D", top: "41%", left: "14%", size: 2.1, dur: 8, delay: 0.9 },
  { ch: "L", top: "53%", left: "7%", size: 1.5, dur: 12, delay: 1.5 },
  { ch: "C", top: "50%", left: "95%", size: 1.9, dur: 9, delay: 0.4 },
  { ch: "I", top: "59%", left: "83%", size: 1.6, dur: 11, delay: 2.0 },
];

export function WrapRain({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const cascadeColor =
    tone === "dark" ? "rgba(154,164,180,0.13)" : "rgba(0,49,104,0.06)";
  const scatterColor =
    tone === "dark" ? "rgba(154,164,180,0.10)" : "rgba(0,49,104,0.05)";
  const mask =
    "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 38%, #000 78%)";

  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none absolute inset-0 select-none overflow-hidden",
        className ?? "",
      ].join(" ")}
    >
      {/* Layer 1 — bottom-weighted drifting word cascade. */}
      <div
        className="absolute inset-x-0 bottom-0 top-[28%] flex justify-center overflow-hidden"
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <div
          className="flex flex-col items-center"
          style={{ animation: "type-cascade 36s linear infinite" }}
        >
          {[0, 1].map((half) =>
            ROWS.map((word, i) => (
              <span
                key={`${half}-${i}`}
                className="type-rain whitespace-nowrap leading-[1.45]"
                style={{
                  color: cascadeColor,
                  fontSize: "clamp(1.4rem, 5vw, 3.25rem)",
                }}
              >
                {word}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Layer 2 — scattered drifting single letters. */}
      {SCATTER.map((s, i) => (
        <span
          key={i}
          className="type-rain absolute"
          style={{
            top: s.top,
            left: s.left,
            color: scatterColor,
            fontSize: `${s.size}rem`,
            letterSpacing: "normal",
            animation: `type-drift ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        >
          {s.ch}
        </span>
      ))}
    </div>
  );
}
