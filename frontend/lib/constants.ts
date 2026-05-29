// lib/constants.ts

export const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W";
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
export const INDEXER_URL =
  process.env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:3001";

// ── Tier ──────────────────────────────────────────────────────────────────────
export type YieldTier = "Retail" | "Institutional" | "Wholesale";

export const TIER_BONUS_BPS: Record<YieldTier, number> = {
  Retail:        0,
  Institutional: 20,
  Wholesale:     50,
};

// ── Raw indexer shapes (match exactly what the API returns) ───────────────────

export interface IndexerPosition {
  id: number;
  owner: string;
  mint: string;
  amount: string;               // NUMERIC → string
  tier: YieldTier;
  last_claim_timestamp: string; // ISO date string from pg
  total_claimed: string;
  accrued_yield: string;
  registered_at: string;
  updated_at: string;
}

export interface IndexerPortfolioResponse {
  wallet: string;
  positions: IndexerPosition[];
  total_value_locked: string;
  total_yield_claimed: string;
  positions_count: number;
}

export interface IndexerClaimEntry {
  id: number;
  owner: string;
  mint: string;
  yield_amount: string;
  total_claimed_after: string;
  tx_signature: string;
  slot: number;
  claimed_at: string;
}

export interface IndexerHistoryResponse {
  wallet: string;
  claims: IndexerClaimEntry[];
  page: number;
  per_page: number;
  total_pages: number;
  total_claims: number;
}

export interface IndexerStatsResponse {
  total_positions: string;
  total_wallets: string;
  total_yield_claimed: string;
  total_tvl: string;
  retrieved_at: string;
}

export interface IndexerLeaderboardResponse {
  leaders: IndexerLeader[];
  retrieved_at: string;
}

export interface IndexerLeader {
  owner: string;
  total_claimed: string;
  position_count: number;
  rank: number;
}

// ── Enriched UI shapes (after mint lookup + number conversion) ────────────────

export interface EnrichedPosition extends IndexerPosition {
  symbol: string;
  decimals: number;
  apy: number;           // computed: (yield_rate_bps + tier_bonus) / 100
  amountUi: number;      // amount / 10^decimals
  accruedYieldUi: number;
  totalClaimedUi: number;
}

export interface PortfolioData {
  wallet: string;
  positions: EnrichedPosition[];
  tvlUi: number;
  totalClaimedUi: number;
  yieldChart: YieldChartPoint[];
}

export interface YieldChartPoint {
  date: string;          // "YYYY-MM-DD"
  yield: number;         // daily yield (UI units)
  cumulative: number;    // running total (UI units)
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
  slot: number;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  totalClaimed: number;
  positionCount: number;
}

// ── Utility helpers ───────────────────────────────────────────────────────────

export function shortenAddress(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export function formatAmount(amount: number, decimals = 6): string {
  const val = amount / Math.pow(10, decimals);
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(2)}K`;
  return val.toFixed(2);
}

export function toUiAmount(raw: string | number, decimals = 6): number {
  return Number(raw) / Math.pow(10, decimals);
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
  if (tokens >= 1_000_000)  return "Institutional";
  return "Retail";
}

export function computeApy(baseRateBps: number, tier: YieldTier): number {
  return (baseRateBps + TIER_BONUS_BPS[tier]) / 100;
}
import { PublicKey } from "@solana/web3.js";
export const PROGRAM_ID_PUBKEY = new PublicKey(PROGRAM_ID);
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
export const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
export const CONFIG_SEED = Buffer.from("config");
export const POSITION_SEED = Buffer.from("position");