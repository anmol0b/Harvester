// hooks/usePortfolio.ts

import useSWR from "swr";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  INDEXER_URL,
  IndexerPortfolioResponse,
  IndexerHistoryResponse,
  IndexerStatsResponse,
  IndexerLeaderboardResponse,
  EnrichedPosition,
  PortfolioData,
  ProtocolStats,
  ClaimHistoryEntry,
  LeaderboardEntry,
  YieldChartPoint,
  toUiAmount,
  computeApy,
} from "@/lib/constants";
import { getMintInfoBatch } from "@/lib/mintRegistry";

// ── Fetcher ───────────────────────────────────────────────────────────────────
const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  });

// ── Mock data (shown while indexer is unreachable or wallet not connected) ────
const MOCK_POSITIONS: EnrichedPosition[] = [
  {
    id: 1,
    owner: "mock",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    amount: String(500_000 * 1_000_000),
    tier: "Institutional",
    last_claim_timestamp: new Date(Date.now() - 86400_000).toISOString(),
    total_claimed: String(45 * 1_000_000),
    accrued_yield: String(12_500_000),
    registered_at: new Date(Date.now() - 30 * 86400_000).toISOString(),
    updated_at: new Date().toISOString(),
    symbol: "USDC",
    decimals: 6,
    apy: 8.2,
    amountUi: 500_000,
    accruedYieldUi: 12.5,
    totalClaimedUi: 45,
  },
  {
    id: 2,
    owner: "mock",
    mint: "RWAre1111111111111111111111111111111111111",
    amount: String(50_000 * 1_000_000),
    tier: "Retail",
    last_claim_timestamp: new Date(Date.now() - 172800_000).toISOString(),
    total_claimed: String(3_200_000),
    accrued_yield: String(800_000),
    registered_at: new Date(Date.now() - 60 * 86400_000).toISOString(),
    updated_at: new Date().toISOString(),
    symbol: "RWA-RE",
    decimals: 6,
    apy: 6.5,
    amountUi: 50_000,
    accruedYieldUi: 0.8,
    totalClaimedUi: 3.2,
  },
];

const MOCK_CHART: YieldChartPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400_000).toISOString().slice(0, 10),
  yield: (i + 1) * 420,
  cumulative: (i + 1) * 1600,
}));

const MOCK_STATS: ProtocolStats = {
  totalTvl: 12_450_000,
  totalClaimed: 384_200,
  totalPositions: 847,
  activeWallets: 312,
  currentRateBps: 820,
  paused: false,
  yieldMint: "HRVSTmint1111111111111111111111111111111111",
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, wallet: "U0M6…NP06", totalClaimed: 50000, positionCount: 8 },
  { rank: 2, wallet: "FBNB…9F10", totalClaimed: 37041, positionCount: 7 },
  { rank: 3, wallet: "5YPY…M924", totalClaimed: 27441, positionCount: 7 },
  { rank: 4, wallet: "M8TE…CI73", totalClaimed: 20328, positionCount: 6 },
  { rank: 5, wallet: "XKRD…4A21", totalClaimed: 15012, positionCount: 5 },
  { rank: 6, wallet: "9QWP…BB03", totalClaimed: 11089, positionCount: 4 },
  { rank: 7, wallet: "RVZL…7F55", totalClaimed: 8201,  positionCount: 3 },
  { rank: 8, wallet: "2HNT…E812", totalClaimed: 6070,  positionCount: 3 },
  { rank: 9, wallet: "JWAK…C349", totalClaimed: 4491,  positionCount: 2 },
  { rank: 10, wallet: "PLMQ…A177", totalClaimed: 3323, positionCount: 1 },
];

// ── Chart builder from claim history ─────────────────────────────────────────
function buildYieldChart(
  claims: IndexerHistoryResponse["claims"],
  decimals = 6,
): YieldChartPoint[] {
  if (!claims.length) return MOCK_CHART;

  // Group by date
  const byDate = new Map<string, number>();
  for (const claim of claims) {
    const date = claim.claimed_at.slice(0, 10);
    const amt  = toUiAmount(claim.yield_amount, decimals);
    byDate.set(date, (byDate.get(date) ?? 0) + amt);
  }

  // Sort dates ascending
  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  let cumulative = 0;
  return sorted.map(([date, yieldAmt]) => {
    cumulative += yieldAmt;
    return { date, yield: Math.round(yieldAmt * 100) / 100, cumulative: Math.round(cumulative * 100) / 100 };
  });
}

// ── usePortfolio ──────────────────────────────────────────────────────────────
export function usePortfolio() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();

  const { data: raw, error, isLoading, mutate } = useSWR<IndexerPortfolioResponse>(
    wallet ? `${INDEXER_URL}/portfolio/${wallet}` : null,
    fetcher,
    { refreshInterval: 15_000 },
  );

  // Claim history for chart (last 100 claims)
  const { data: historyRaw } = useSWR<IndexerHistoryResponse>(
    wallet ? `${INDEXER_URL}/history/${wallet}?page=1&per_page=100` : null,
    fetcher,
    { refreshInterval: 30_000 },
  );

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (!raw) return;

    async function enrich() {
      setEnriching(true);
      try {
        const mints = raw!.positions.map((p) => p.mint);
        const mintMap = await getMintInfoBatch(mints);

        // We don't have rate_bps from portfolio endpoint — default 500 bps
        // In a full build you'd fetch /stats once and pass it down.
        const BASE_RATE_BPS = 500;

        const enriched: EnrichedPosition[] = raw!.positions.map((pos) => {
          const { symbol, decimals } = mintMap[pos.mint] ?? { symbol: pos.mint.slice(0, 4).toUpperCase(), decimals: 6 };
          return {
            ...pos,
            symbol,
            decimals,
            apy: computeApy(BASE_RATE_BPS, pos.tier),
            amountUi:       toUiAmount(pos.amount,       decimals),
            accruedYieldUi: toUiAmount(pos.accrued_yield, decimals),
            totalClaimedUi: toUiAmount(pos.total_claimed, decimals),
          };
        });

        const decimals = enriched[0]?.decimals ?? 6;
        const chart = buildYieldChart(historyRaw?.claims ?? [], decimals);

        setPortfolio({
          wallet:          raw!.wallet,
          positions:       enriched,
          tvlUi:           toUiAmount(raw!.total_value_locked, decimals),
          totalClaimedUi:  toUiAmount(raw!.total_yield_claimed, decimals),
          yieldChart:      chart,
        });
      } finally {
        setEnriching(false);
      }
    }

    enrich();
  }, [raw, historyRaw]);

  const mockPortfolio: PortfolioData = {
    wallet: wallet ?? "",
    positions: MOCK_POSITIONS,
    tvlUi: 550_000,
    totalClaimedUi: 48.2,
    yieldChart: MOCK_CHART,
  };

  return {
    portfolio:  portfolio ?? (wallet ? mockPortfolio : null),
    isLoading:  isLoading || enriching,
    isMock:     !raw,
    error,
    refresh:    mutate,
  };
}

// ── useProtocolStats ──────────────────────────────────────────────────────────
export function useProtocolStats() {
  const { data, error, isLoading } = useSWR<IndexerStatsResponse>(
    `${INDEXER_URL}/stats`,
    fetcher,
    { refreshInterval: 30_000 },
  );

  const stats: ProtocolStats | null = data
    ? {
        totalTvl:       toUiAmount(data.total_tvl),
        totalClaimed:   toUiAmount(data.total_yield_claimed),
        totalPositions: Number(data.total_positions),
        activeWallets:  Number(data.total_wallets),
        currentRateBps: 500, // fetch from /config endpoint if you add one
        paused:         false,
        yieldMint:      "",
      }
    : null;

  return {
    stats:    stats ?? MOCK_STATS,
    isLoading,
    isMock:   !data,
    error,
  };
}

// ── useLeaderboard ────────────────────────────────────────────────────────────
export function useLeaderboard() {
  const { data, isLoading, error } = useSWR<IndexerLeaderboardResponse>(
    `${INDEXER_URL}/yields/top?limit=10`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  const leaderboard: LeaderboardEntry[] = data
    ? data.leaders.map((l) => ({
        rank:          l.rank,
        wallet:        l.owner,
        totalClaimed:  toUiAmount(l.total_claimed),
        positionCount: l.position_count,
      }))
    : MOCK_LEADERBOARD;

  return { leaderboard, isLoading, isMock: !data, error };
}

// ── useClaimHistory ───────────────────────────────────────────────────────────
export function useClaimHistory(page = 1, perPage = 10) {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();

  const { data, isLoading, error } = useSWR<IndexerHistoryResponse>(
    wallet
      ? `${INDEXER_URL}/history/${wallet}?page=${page}&per_page=${perPage}`
      : null,
    fetcher,
    { refreshInterval: 30_000 },
  );

  const [entries, setEntries] = useState<ClaimHistoryEntry[]>([]);

  useEffect(() => {
    if (!data?.claims) return;
    const mints = data.claims.map((c) => c.mint);
    getMintInfoBatch(mints).then((mintMap) => {
      setEntries(
        data.claims.map((c) => {
          const { symbol, decimals } = mintMap[c.mint] ?? { symbol: c.mint.slice(0, 4).toUpperCase(), decimals: 6 };
          return {
            txSignature:  c.tx_signature,
            mint:         c.mint,
            symbol,
            yieldAmount:  toUiAmount(c.yield_amount, decimals),
            totalClaimed: toUiAmount(c.total_claimed_after, decimals),
            timestamp:    Math.floor(new Date(c.claimed_at).getTime() / 1000),
            slot:         c.slot,
          };
        }),
      );
    });
  }, [data]);

  const mockEntries: ClaimHistoryEntry[] = Array.from({ length: 12 }, (_, i) => ({
    txSignature:  `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
    mint:         i % 2 === 0 ? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" : "RWAre111",
    symbol:       i % 2 === 0 ? "USDC" : "RWA-RE",
    yieldAmount:  Math.round((Math.random() * 2 + 0.5) * 100) / 100,
    totalClaimed: Math.round((10_000 - i * 700) * 100) / 100,
    timestamp:    Math.floor(Date.now() / 1000) - i * 86400,
    slot:         465_000_000 - i * 400,
  }));

  return {
    history:    entries.length ? { entries, total: data?.total_claims ?? 0 } : (wallet ? { entries: mockEntries, total: 12 } : null),
    isLoading,
    isMock:     !data,
    totalPages: data?.total_pages ?? 1,
    error,
  };
}