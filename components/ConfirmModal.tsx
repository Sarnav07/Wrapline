"use client";

import { useCallback, useState } from "react";

type ConfirmOptions = {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  tone?: "default" | "danger";
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

/**
 * A promise-based confirmation gate. Call `await confirm({...})` before a
 * sensitive action (mainnet writes move real funds) and render `modal` once in
 * the component. Resolves `true` on confirm, `false` on cancel/backdrop.
 */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve })),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      setPending((p) => {
        p?.resolve(ok);
        return null;
      });
    },
    [],
  );

  const modal = pending ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => close(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0E1424] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">{pending.title}</h3>
        <div className="mt-3 text-sm text-[#94A2B8]">{pending.body}</div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-[#94A2B8] ring-1 ring-white/10 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-accent-blue-foreground hover:brightness-95 ${
              pending.tone === "danger" ? "bg-rose-400" : "bg-accent-blue"
            }`}
          >
            {pending.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, modal };
}
