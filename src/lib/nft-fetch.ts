// Fetch Rare Pizza NFTs from Alchemy API

import { NFTDisplayItem, AlchemyNFT } from "./nft-types";

// Alchemy API endpoints by chain
const ALCHEMY_CHAIN_URLS: Record<string, string> = {
  ethereum: "https://eth-mainnet.g.alchemy.com/nft/v3",
  base: "https://base-mainnet.g.alchemy.com/nft/v3",
  polygon: "https://polygon-mainnet.g.alchemy.com/nft/v3",
  zora: "https://zora-mainnet.g.alchemy.com/nft/v3",
  optimism: "https://opt-mainnet.g.alchemy.com/nft/v3",
};

// PizzaDAO NFT Contracts Sheet URL for fetching contract addresses dynamically
const NFT_CONTRACTS_SHEET_ID = "1I9Sjj5kNQOushVbYGSnG668tMOAz0SJ3L8StaCG5r0I";

interface NFTContract {
  chain: string;
  address: string;
  name: string;
  order?: number;
}

// Cache for contracts
let contractsCache: NFTContract[] | null = null;

// Parse Google Sheets GViz JSON response
function parseGvizJson(text: string): { table?: { cols: { label?: string }[]; rows: { c: { v?: unknown }[] }[] } } | null {
  try {
    // GViz response is wrapped in: google.visualization.Query.setResponse({...});
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    return null;
  }
}

/**
 * Fetch NFT contract addresses from Google Sheets
 */
async function getNFTContracts(): Promise<NFTContract[]> {
  if (contractsCache) {
    return contractsCache;
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${NFT_CONTRACTS_SHEET_ID}/gviz/tq?tqx=out:json&headers=1`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return [];
    }

    const text = await res.text();
    const gviz = parseGvizJson(text);
    const cols = gviz?.table?.cols || [];
    const rows = gviz?.table?.rows || [];

    // Find column indices
    const headers = cols.map((c) => String(c?.label || "").trim().toLowerCase());
    const chainIdx = headers.findIndex((h) => h === "chain");
    const contractIdx = headers.findIndex((h) => h === "contract");
    const nameIdx = headers.findIndex((h) => h === "name");
    const orderIdx = headers.findIndex((h) => h === "order");

    if (chainIdx === -1 || contractIdx === -1) {
      return [];
    }

    const contracts: NFTContract[] = [];

    for (const row of rows) {
      const cells = row?.c || [];
      const chain = String(cells[chainIdx]?.v || "").trim().toLowerCase();
      const address = String(cells[contractIdx]?.v || "").trim();
      const name = nameIdx !== -1 ? String(cells[nameIdx]?.v || "").trim() : "";
      const orderVal = orderIdx !== -1 ? cells[orderIdx]?.v : undefined;
      const order = typeof orderVal === "number" ? orderVal : parseInt(String(orderVal), 10);

      // Validate contract address format
      if (chain && address && address.startsWith("0x") && address.length === 42) {
        contracts.push({
          chain,
          address,
          name: name || "Unknown Collection",
          order: !isNaN(order) ? order : undefined,
        });
      }
    }

    contractsCache = contracts;
    return contracts;
  } catch (error) {
    console.error("Failed to fetch NFT contracts:", error);
    return [];
  }
}

/**
 * Fetch NFTs from Alchemy for a specific wallet and contract
 */
async function fetchNFTsForContract(
  walletAddress: string,
  contract: NFTContract,
  apiKey: string
): Promise<AlchemyNFT[]> {
  const baseUrl = ALCHEMY_CHAIN_URLS[contract.chain];
  if (!baseUrl) {
    return [];
  }

  const allNfts: AlchemyNFT[] = [];
  let pageKey: string | undefined;
  const maxPages = 5; // Safety limit

  try {
    for (let page = 0; page < maxPages; page++) {
      let url = `${baseUrl}/${apiKey}/getNFTsForOwner?owner=${walletAddress}&contractAddresses[]=${contract.address}&withMetadata=true`;
      if (pageKey) {
        url += `&pageKey=${pageKey}`;
      }

      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        break;
      }

      const data = await res.json();
      const nfts = data.ownedNfts || [];
      allNfts.push(...nfts);

      if (!data.pageKey) {
        break;
      }
      pageKey = data.pageKey;
    }

    return allNfts;
  } catch (error) {
    console.error(`Failed to fetch NFTs for ${contract.name}:`, error);
    return allNfts;
  }
}

/**
 * Transform Alchemy NFT to display format
 */
function transformNFT(nft: AlchemyNFT, contract: NFTContract): NFTDisplayItem {
  return {
    contractAddress: nft.contract.address,
    contractName: contract.name || nft.contract.name || "Unknown Collection",
    tokenId: nft.tokenId,
    name: nft.name || `#${nft.tokenId}`,
    imageUrl: nft.image?.cachedUrl || nft.image?.originalUrl || "",
    thumbnailUrl: nft.image?.thumbnailUrl || nft.image?.cachedUrl || "",
    chain: contract.chain,
    order: contract.order,
    metadata: nft.raw?.metadata,
  };
}

/**
 * Fetch all PizzaDAO NFTs for a wallet (multi-chain)
 */
export async function fetchPizzaDAONFTs(walletAddress: string): Promise<NFTDisplayItem[]> {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

  if (!apiKey) {
    console.warn("VITE_ALCHEMY_API_KEY not set - NFT fetching disabled");
    return [];
  }

  if (!walletAddress || !walletAddress.startsWith("0x")) {
    return [];
  }

  try {
    const contracts = await getNFTContracts();
    const allNFTs: NFTDisplayItem[] = [];

    // Fetch from all contracts in parallel
    const fetchPromises = contracts.map(async (contract) => {
      const nfts = await fetchNFTsForContract(walletAddress, contract, apiKey);
      return nfts.map((nft) => transformNFT(nft, contract));
    });

    const results = await Promise.all(fetchPromises);
    for (const nfts of results) {
      allNFTs.push(...nfts);
    }

    // Sort by order (Rare Pizzas should come first)
    allNFTs.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return 0;
    });

    return allNFTs;
  } catch (error) {
    console.error("Failed to fetch PizzaDAO NFTs:", error);
    return [];
  }
}

// Local storage key for selected NFT
const SELECTED_NFT_KEY = "agar-pizza-selected-nft";

/**
 * Save selected NFT image URL to localStorage
 */
export function saveSelectedNFT(imageUrl: string | null): void {
  if (imageUrl) {
    localStorage.setItem(SELECTED_NFT_KEY, imageUrl);
  } else {
    localStorage.removeItem(SELECTED_NFT_KEY);
  }
}

/**
 * Get selected NFT image URL from localStorage
 */
export function getSelectedNFT(): string | null {
  return localStorage.getItem(SELECTED_NFT_KEY);
}
