"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { usePortfolio, useProtocolStats, useLeaderboard } from "@/hooks/usePortfolio";
import { useGlobalConfig } from "@/hooks/useGlobalConfig";
import StatCard from "@/components/StatCard";
import YieldChart from "@/components/YieldChart";
import TierBadge from "@/components/TierBadge";
import { shortenAddress, formatAmount } from "@/lib/constants";

export default function Dashboard() {
  const { publicKey } = useWallet();
  const { stats, isMock: statsMock } = useProtocolStats();
  const { portfolio, isLoading, isMock } = usePortfolio();
  const { leaderboard } = useLeaderboard();
  const { config } = useGlobalConfig();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>
            HARVESTER
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.2em", marginTop: "0.4rem" }}>
            REAL WORLD ASSET YIELD PROTOCOL
            {statsMock && <span style={{ marginLeft: "0.75rem" }}>— DEMO DATA</span>}
          </p>
        </div>
        {config && (
          <div style={{ textAlign: "right", fontSize: "0.65rem", color: "var(--text-dim)" }}>
            <div>BASE RATE</div>
            <div style={{ color: "var(--gold-light)", fontSize: "1rem", fontWeight: 600 }}>
              {(config.yieldRateBps / 100).toFixed(2)}% APY
            </div>
          </div>
        )}
      </div>

      {/* Protocol Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)" }}>
        <StatCard label="Total TVL"        value={`$${formatAmount(stats.totalTvl, 0)}`}       sub="across all positions" />
        <StatCard label="Yield Claimed"    value={`$${formatAmount(stats.totalClaimed, 0)}`}    sub="cumulative harvested" />
        <StatCard label="Active Positions" value={stats.totalPositions.toLocaleString()}        sub="registered on-chain" />
        <StatCard label="Unique Wallets"   value={stats.activeWallets.toLocaleString()}         sub="participating wallets" />
      </div>

      {/* Portfolio or connect CTA */}
      {publicKey ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)" }}>
          <div style={{ background: "var(--ink)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.16em", color: "var(--text-dim)" }}>YOUR PORTFOLIO</div>
            {isLoading ? (
              <div style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>LOADING…</div>
            ) : portfolio ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)" }}>
                  <StatCard label="Your TVL"     value={`$${formatAmount(portfolio.tvlUi, 0)}`}    />
                  <StatCard label="Total Earned" value={`$${portfolio.totalClaimedUi.toFixed(4)}`} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {portfolio.positions.slice(0, 3).map((pos) => (
                    <div key={pos.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.75rem", border: "1px solid var(--border)", fontSize: "0.7rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>{pos.symbol}</span>
                        <TierBadge tier={pos.tier} />
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "var(--text-primary)" }}>{pos.amountUi.toLocaleString()}</div>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.6rem" }}>+{pos.accruedYieldUi.toFixed(4)} accrued</div>
                      </div>
                    </div>
                  ))}
                  {portfolio.positions.length === 0 && (
                    <div style={{ color: "var(--text-dim)", fontSize: "0.65rem", padding: "1rem 0" }}>
                      No positions yet — visit Discover to get started.
                    </div>
                  )}
                  {portfolio.positions.length > 3 && (
                    <div style={{ color: "var(--text-dim)", fontSize: "0.6rem", textAlign: "center" }}>
                      +{portfolio.positions.length - 3} more positions
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <div style={{ background: "var(--ink)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.6rem", letterSpacing: "0.16em", color: "var(--text-dim)" }}>YIELD HISTORY</span>
              {isMock && <span style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>DEMO</span>}
            </div>
            <YieldChart data={portfolio?.yieldChart ?? []} height={220} />
          </div>
        </div>
      ) : (
        <div style={{
          border: "1px solid var(--border)", padding: "3rem", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
          background: "rgba(184,134,11,0.02)",
        }}>
          <div style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1.1rem" }}>
            Connect your wallet to view your portfolio
          </div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.65rem", maxWidth: "360px", lineHeight: 1.8 }}>
            Register RWA positions, track accrued yield, and harvest HRVST tokens directly from your wallet.
          </div>
          <WalletMultiButton />
        </div>
      )}

      {/* Top Yielders */}
      <div style={{ border: "1px solid var(--border)" }}>
        <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.6rem", letterSpacing: "0.16em", color: "var(--text-dim)" }}>
          TOP YIELDERS
        </div>
        {leaderboard.slice(0, 5).map((entry, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.75rem 1.25rem", borderBottom: i < 4 ? "1px solid var(--border)" : "none", fontSize: "0.7rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ color: i < 3 ? "var(--gold-light)" : "var(--text-dim)", fontWeight: i < 3 ? 600 : 400, width: "1.2rem" }}>
                #{entry.rank}
              </span>
              <span style={{ color: "var(--text-primary)" }}>{shortenAddress(entry.wallet)}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--gold-light)" }}>${entry.totalClaimed.toLocaleString()}</div>
              <div style={{ color: "var(--text-dim)", fontSize: "0.6rem" }}>{entry.positionCount} position{entry.positionCount !== 1 ? "s" : ""}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}