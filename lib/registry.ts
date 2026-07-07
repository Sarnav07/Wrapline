import { useMemo } from "react";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { erc20Abi, type Address } from "viem";
import { useListPairs } from "@zama-fhe/react-sdk";
import { customPairsForChain, REGISTRY_ADDRESSES, WRAPPERS_REGISTRY_ABI, type TokenMeta } from "@/config/pairs";

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

// ---------------------------------------------------------------------------
// Dual-chain registry — reads both Sepolia and Mainnet simultaneously via
// direct contract calls, bypassing the SDK's active-chain restriction.
// Used only by RegistryTable (browse view). Action panels use useRegistryPairs.
// ---------------------------------------------------------------------------

type RawPair = { tokenAddress: Address; confidentialTokenAddress: Address; isValid: boolean };

function buildMetadataContracts(pairs: RawPair[], chainId: number) {
  return pairs.flatMap((p) => [
    { abi: erc20Abi, address: p.tokenAddress,             functionName: "symbol"   as const, chainId },
    { abi: erc20Abi, address: p.tokenAddress,             functionName: "decimals" as const, chainId },
    { abi: erc20Abi, address: p.tokenAddress,             functionName: "name"     as const, chainId },
    { abi: erc20Abi, address: p.confidentialTokenAddress, functionName: "symbol"   as const, chainId },
    { abi: erc20Abi, address: p.confidentialTokenAddress, functionName: "decimals" as const, chainId },
    { abi: erc20Abi, address: p.confidentialTokenAddress, functionName: "name"     as const, chainId },
  ]);
}

function zipRows(
  pairs: RawPair[],
  meta: { result?: unknown; status: string }[],
  chainId: number,
): RegistryRow[] {
  return pairs.map((p, i) => {
    const base = i * 6;
    const underlyingSymbol  = String(meta[base]?.result     ?? "?");
    const underlyingDec     = Number(meta[base + 1]?.result ?? 18);
    // name() is optional on some tokens; fall back to symbol when absent.
    const underlyingName    = String(meta[base + 2]?.result ?? underlyingSymbol);
    const confSymbol        = String(meta[base + 3]?.result ?? "?");
    const confDec           = Number(meta[base + 4]?.result ?? 18);
    const confName          = String(meta[base + 5]?.result ?? confSymbol);
    return {
      chainId,
      erc20Address:             p.tokenAddress,
      confidentialTokenAddress: p.confidentialTokenAddress,
      underlying:   { name: underlyingName, symbol: underlyingSymbol, decimals: underlyingDec },
      confidential: { name: confName,       symbol: confSymbol,       decimals: confDec },
      isValid: p.isValid,
      source: "onchain" as const,
    };
  });
}

/**
 * Reads both Sepolia and Mainnet Wrappers Registries in parallel, regardless
 * of which chain the wallet is connected to. Returns a merged RegistryRow[]
 * tagged with chainId so RegistryTable can show both networks at once.
 */
export function useAllChainsPairs() {
  const sepoliaReg = useReadContract({
    abi: WRAPPERS_REGISTRY_ABI,
    address: REGISTRY_ADDRESSES[sepolia.id],
    functionName: "getTokenConfidentialTokenPairs",
    chainId: sepolia.id,
  });
  const mainnetReg = useReadContract({
    abi: WRAPPERS_REGISTRY_ABI,
    address: REGISTRY_ADDRESSES[mainnet.id],
    functionName: "getTokenConfidentialTokenPairs",
    chainId: mainnet.id,
  });

  // Memoize so the array references stay stable across renders — otherwise the
  // `rows` memo below re-runs on every render and never actually memoizes.
  const sepoliaPairs = useMemo(
    () => (sepoliaReg.data as RawPair[] | undefined) ?? [],
    [sepoliaReg.data],
  );
  const mainnetPairs = useMemo(
    () => (mainnetReg.data as RawPair[] | undefined) ?? [],
    [mainnetReg.data],
  );

  const sepoliaMeta = useReadContracts({
    contracts: buildMetadataContracts(sepoliaPairs, sepolia.id),
    allowFailure: true,
    query: { enabled: sepoliaPairs.length > 0 },
  });
  const mainnetMeta = useReadContracts({
    contracts: buildMetadataContracts(mainnetPairs, mainnet.id),
    allowFailure: true,
    query: { enabled: mainnetPairs.length > 0 },
  });

  const rows = useMemo(() => {
    const sepoliaRows = zipRows(sepoliaPairs, sepoliaMeta.data ?? [], sepolia.id);
    const mainnetRows = zipRows(mainnetPairs, mainnetMeta.data ?? [], mainnet.id);
    const seen = new Set(
      [...sepoliaRows, ...mainnetRows].map((r) => `${r.chainId}:${r.confidentialTokenAddress.toLowerCase()}`),
    );
    const custom: RegistryRow[] = [sepolia.id, mainnet.id].flatMap((cid) =>
      customPairsForChain(cid)
        .filter((p) => !seen.has(`${cid}:${p.confidentialTokenAddress.toLowerCase()}`))
        .map((p) => ({
          chainId: cid,
          erc20Address: p.erc20Address,
          confidentialTokenAddress: p.confidentialTokenAddress,
          underlying: p.underlying,
          confidential: p.confidential,
          isValid: true,
          source: "custom" as const,
        })),
    );
    return [...sepoliaRows, ...mainnetRows, ...custom];
  }, [sepoliaPairs, mainnetPairs, sepoliaMeta.data, mainnetMeta.data]);

  return {
    rows,
    isLoading: sepoliaReg.isLoading || mainnetReg.isLoading,
    isError:   sepoliaReg.isError   || mainnetReg.isError,
  };
}
