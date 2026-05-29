export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W";
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
export const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:3001";

export type YieldTier = "Retail" | "Institutional" | "Wholesale";

export interface IndexerPosition {
  pubkey: string;
  mint: string;
  symbol: string;
  amount: number;
  accruedYield: number;
  totalClaimed: number;
  tier: YieldTier;
  lastClaimTimestamp: number;
  apy: number;
  decimals: number;
}

export interface PortfolioResponse {
  wallet: string;
  positions: IndexerPosition[];
  tvl: number;
  totalClaimed: number;
  yieldChart: { date: string; yield: number; cumulative: number }[];
}

export interface ProtocolStats {
  totalTvl: number;
  totalClaimed: number;
  totalPositions: number;
  activeWallets: number;
  currentRateBps: number;
  paused: boolean;
  yieldMint: string;
}

export interface ClaimHistoryEntry {
  txSignature: string;
  mint: string;
  symbol: string;
  yieldAmount: number;
  totalClaimed: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  totalClaimed: number;
  tvl: number;
  positions: number;
}

export function shortenAddress(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export function formatAmount(amount: number, decimals: number): string {
  const val = amount / Math.pow(10, decimals);
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
  return val.toFixed(2);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function getTier(amount: number, decimals: number): YieldTier {
  const tokens = amount / Math.pow(10, decimals);
  if (tokens >= 10_000_000) return "Wholesale";
  if (tokens >= 1_000_000) return "Institutional";
  return "Retail";
}