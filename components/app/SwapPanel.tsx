import type { ReactNode } from "react";
import { cx } from "@/components/landing/primitives";

/* ------------------------------------------------------------------ *
 * SwapPanel — the Uniswap-style input surface: a rounded panel with a
 * label, a big amount field on the left and a token selector on the
 * right, plus an optional footer (balance / helper text).
 * ------------------------------------------------------------------ */
export function SwapPanel({
  label,
  input,
  select,
  footer,
  className,
}: {
  label: string;
  input: ReactNode;
  select: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/8 bg-black/25 p-5 transition-colors focus-within:border-white/15",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-wider text-[#7A8699]">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">{input}</div>
        <div className="shrink-0">{select}</div>
      </div>
      {footer && <div className="mt-2 flex items-center justify-between text-sm">{footer}</div>}
    </div>
  );
}
