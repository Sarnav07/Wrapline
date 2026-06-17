"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 * ParticleDome — fills its (relatively positioned) parent with the
 * rising point-cloud dome. Same SSR discipline as the globe: the
 * <Canvas> is dynamically imported with { ssr: false } and only mounted
 * once the host scrolls into view; reduced-motion users get a static
 * dotted-dome CSS fallback.
 * ------------------------------------------------------------------ */

const DomeSkeleton = () => (
  <div className="absolute inset-x-0 bottom-0 flex justify-center">
    <div className="h-56 w-[28rem] max-w-[90vw] animate-pulse rounded-t-full bg-[radial-gradient(ellipse_at_bottom,rgba(0,107,228,0.16),transparent_70%)]" />
  </div>
);

const DomeCanvas = dynamic(
  () => import("./three/DomeCanvas").then((m) => m.DomeCanvas),
  { ssr: false, loading: () => <DomeSkeleton /> }
);

/* Static fallback: a dotted half-dome rising from the bottom. */
function StaticDome() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center">
      <div
        className="h-56 w-[34rem] max-w-[95vw] rounded-t-full opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,107,228,0.5) 1px, transparent 1.4px)",
          backgroundSize: "16px 16px",
          maskImage:
            "radial-gradient(ellipse at bottom, #000 50%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at bottom, #000 50%, transparent 75%)",
        }}
      />
    </div>
  );
}

export function ParticleDome() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      {reduced ? <StaticDome /> : inView ? <DomeCanvas /> : <DomeSkeleton />}
    </div>
  );
}
