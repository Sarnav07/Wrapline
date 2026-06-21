import { useMemo } from "react";
import { useChainId } from "wagmi";
import { useListPairs } from "@zama-fhe/react-sdk";
import type { Address } from "viem";
import { customPairsForChain, type TokenMeta } from "@/config/pairs";

/** A single registry pair, normalised across on-chain and custom sources. */
export type RegistryRow = {
  chainId: number;
  erc20Address: Address;
  confidentialTokenAddress: Address;
  underlying: TokenMeta;
  confidential: TokenMeta;
  isValid: boolean;
  source: "onchain" | "custom";
};

export type RegistryCoverage = {
  total: number;
  onchain: number;
  custom: number;
};

/**
 * Resolves the hybrid registry for the connected chain: the on-chain Wrappers
 * Registry (primary, via the SDK) merged with the local `config/pairs.ts`
 * overlay. The SDK reads from the active chain and re-fetches on network switch,
 * so switching the wallet network swaps the result set.
 */
export function useRegistryPairs() {
  const chainId = useChainId();
  const query = useListPairs({ metadata: true, pageSize: 100 });

  const { rows, coverage } = useMemo(() => {
    const onchain: RegistryRow[] = (query.data?.items ?? []).map((pair) => {
      // metadata: true guarantees the enriched shape; fall back defensively.
      const meta = "underlying" in pair ? pair : null;
      return {
        chainId,
        erc20Address: pair.tokenAddress,
        confidentialTokenAddress: pair.confidentialTokenAddress,
        underlying: meta
          ? { name: meta.underlying.name, symbol: meta.underlying.symbol, decimals: meta.underlying.decimals }
          : { name: "Unknown", symbol: "?", decimals: 18 },
        confidential: meta
          ? { name: meta.confidential.name, symbol: meta.confidential.symbol, decimals: meta.confidential.decimals }
          : { name: "Unknown", symbol: "?", decimals: 18 },
        isValid: pair.isValid,
        source: "onchain" as const,
      };
    });

    const seen = new Set(onchain.map((row) => row.confidentialTokenAddress.toLowerCase()));
    const custom: RegistryRow[] = customPairsForChain(chainId)
      .filter((pair) => !seen.has(pair.confidentialTokenAddress.toLowerCase()))
      .map((pair) => ({
        chainId,
        erc20Address: pair.erc20Address,
        confidentialTokenAddress: pair.confidentialTokenAddress,
        underlying: pair.underlying,
        confidential: pair.confidential,
        isValid: true,
        source: "custom" as const,
      }));

    return {
      rows: [...onchain, ...custom],
      coverage: { total: onchain.length + custom.length, onchain: onchain.length, custom: custom.length },
    };
  }, [query.data, chainId]);

  return {
    rows,
    validRows: rows.filter((r) => r.isValid),
    coverage,
    chainId,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
