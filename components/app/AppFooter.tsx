import Link from "next/link";
import { sepolia, mainnet } from "wagmi/chains";
import { Monogram } from "@/components/landing/Monogram";
import { REGISTRY_ADDRESSES } from "@/config/pairs";

const COL_HEADING = "text-white/50 text-xs uppercase tracking-wider";
const COL_LINKS = "mt-4 flex flex-col gap-2.5";
const LINK = "text-white/60 hover:text-white text-sm transition-colors";

// Registry contract on the block explorer for each supported chain.
const SEPOLIA_REGISTRY = `https://sepolia.etherscan.io/address/${REGISTRY_ADDRESSES[sepolia.id]}`;
const MAINNET_REGISTRY = `https://etherscan.io/address/${REGISTRY_ADDRESSES[mainnet.id]}`;

export function AppFooter() {
  return (
    <footer className="bg-bg-dark text-foreground border-t border-white/10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <Monogram size={28} />
              <span className="font-display font-bold text-lg">Wrapline</span>
            </div>
            <p className="mt-4 text-[#94A2B8] text-sm">
              Confidential Wrapper Registry
            </p>
            <p className="mt-2 text-white/40 text-xs">
              Built on the Zama FHE protocol.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className={COL_HEADING}>Product</h3>
            <div className={COL_LINKS}>
              <a href="#registry" className={LINK}>
                Registry
              </a>
              <Link href="/" className={LINK}>
                Home
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className={COL_HEADING}>Resources</h3>
            <div className={COL_LINKS}>
              <a
                href="https://docs.zama.ai"
                target="_blank"
                rel="noreferrer"
                className={LINK}
              >
                Docs
              </a>
              <a
                href="https://github.com/Sarnav07/Wrapline"
                target="_blank"
                rel="noreferrer"
                className={LINK}
              >
                GitHub
              </a>
              <a
                href="https://zama.ai"
                target="_blank"
                rel="noreferrer"
                className={LINK}
              >
                Zama
              </a>
            </div>
          </div>

          {/* Networks — link to the live registry contract on each chain */}
          <div>
            <h3 className={COL_HEADING}>Networks</h3>
            <div className={COL_LINKS}>
              <a
                href={SEPOLIA_REGISTRY}
                target="_blank"
                rel="noreferrer"
                className={LINK}
              >
                Sepolia
              </a>
              <a
                href={MAINNET_REGISTRY}
                target="_blank"
                rel="noreferrer"
                className={LINK}
              >
                Ethereum
              </a>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-white/40 text-xs">
          <p>© Wrapline</p>
          <p>Not affiliated with Zama. Built on the public Zama Protocol.</p>
        </div>
      </div>
    </footer>
  );
}
