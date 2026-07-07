/**
 * Global single-flight lock for wallet-signature requests.
 *
 * MetaMask queues signTypedData requests internally and (especially in Brave)
 * doesn't always auto-open its popup — a request the user never sees. If the
 * app fires another one while the first sits queued, the prompts stack and all
 * flush at once on the next connect. Serializing every signature-producing call
 * through this chain guarantees at most one pending wallet prompt at a time.
 */
let chain: Promise<unknown> = Promise.resolve();

/** Run `fn` after every previously queued signature request settles. */
export function withSignatureLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = () => fn();
  const p = chain.then(run, run);
  // Swallow rejections on the chain itself so one failure doesn't wedge it;
  // callers still see their own promise reject.
  chain = p.catch(() => {});
  return p;
}
