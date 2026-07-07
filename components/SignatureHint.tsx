"use client";

import { useEffect, useState } from "react";

/**
 * Delayed "wallet didn't pop up?" hint. MetaMask (notably in Brave) sometimes
 * queues a signature request without opening its window — the user stares at a
 * silent UI while the request waits inside the extension. After ~6s of a
 * continuously pending signature, point them at it.
 */
export function SignatureHint({ active }: { active: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), 6000);
    return () => clearTimeout(t);
  }, [active]);

  if (!active || !show) return null;
  return (
    <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-300 ring-1 ring-amber-400/20">
      Wallet didn&apos;t pop up? Open the MetaMask extension manually — your signature request is
      waiting inside it. If old requests are stacked above it, reject those first.
    </p>
  );
}
