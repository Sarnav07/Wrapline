import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Wrapline App — Confidential Wrapper Registry",
  description:
    "Browse, wrap, unwrap, and decrypt every official ERC-20 ↔ ERC-7984 pair on Sepolia and Ethereum mainnet. Powered by the Zama Protocol.",
};

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <Providers>{children}</Providers>;
}
