"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ElementType,
} from "react";

/* Tiny className joiner (no clsx dependency in this project). */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ *
 * PillButton — the Fluxo pill. Renders <Link> when `href` is given,
 * otherwise a <button>. Variants adapt to dark / light sections.
 * ------------------------------------------------------------------ */
type PillVariant = "primary" | "dark" | "light" | "outline";
type PillSize = "sm" | "md";

const PILL_BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60 disabled:opacity-50 disabled:pointer-events-none";

const PILL_VARIANTS: Record<PillVariant, string> = {
  primary:
    "bg-accent-blue text-accent-blue-foreground hover:brightness-110 hover:-translate-y-0.5 shadow-float-blue",
  dark: "bg-bg-dark text-white ring-1 ring-white/15 hover:ring-white/30 hover:-translate-y-0.5",
  light:
    "bg-white text-fg-dark ring-1 ring-black/5 hover:bg-white/90 hover:-translate-y-0.5",
  outline:
    "bg-transparent ring-1 ring-current/25 hover:bg-current/5 hover:-translate-y-0.5",
};

const PILL_SIZES: Record<PillSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-[15px]",
};

export function PillButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  external,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: PillVariant;
  size?: PillSize;
  className?: string;
  external?: boolean;
}) {
  const cls = cx(PILL_BASE, PILL_VARIANTS[variant], PILL_SIZES[size], className);
  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * GlassCard — large-radius floating surface. `tone` picks the palette.
 * ------------------------------------------------------------------ */
type CardTone = "light" | "dark" | "blue" | "glass";

const CARD_TONES: Record<CardTone, string> = {
  light: "bg-white text-fg-dark ring-1 ring-black/[0.06] shadow-glass-light",
  dark: "bg-[#17131E] text-foreground ring-1 ring-white/10 shadow-float",
  blue: "bg-accent-blue text-accent-blue-foreground shadow-float-blue",
  glass:
    "bg-white/70 text-fg-dark ring-1 ring-white/40 backdrop-blur-xl shadow-glass-light",
};

export function GlassCard({
  children,
  tone = "light",
  className,
  as: As = "div",
}: {
  children: ReactNode;
  tone?: CardTone;
  className?: string;
  as?: ElementType;
}) {
  return (
    <As className={cx("rounded-card", CARD_TONES[tone], className)}>
      {children}
    </As>
  );
}

/* ------------------------------------------------------------------ *
 * SectionHeading — eyebrow + display title (with blue accent word)
 * + optional subtitle. `tone` flips text colors for dark/light.
 * ------------------------------------------------------------------ */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = "light",
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}) {
  const muted = tone === "dark" ? "text-[#94A2B8]" : "text-text-muted";
  return (
    <div
      className={cx(
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className
      )}
    >
      {eyebrow && (
        <p className="text-accent-blue text-xs font-semibold uppercase tracking-[0.2em]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 font-display text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      {subtitle && (
        <p className={cx("mt-4 text-base leading-relaxed sm:text-lg", muted)}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Reveal — fade-up on first scroll into view (respects reduced-motion
 * via the global CSS rule that flattens animation duration).
 * ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <As
      ref={ref}
      className={cx(
        shown ? "animate-fade-up" : "opacity-0",
        className
      )}
      style={shown ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </As>
  );
}

/* ------------------------------------------------------------------ *
 * AnimatedCounter — eases from 0 → value when scrolled into view.
 * ------------------------------------------------------------------ */
export function AnimatedCounter({
  value,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let start = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const step = (ts: number) => {
          if (!start) start = ts;
          const t = Math.min((ts - start) / duration, 1);
          // easeOutExpo
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setDisplay(value * eased);
          if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
