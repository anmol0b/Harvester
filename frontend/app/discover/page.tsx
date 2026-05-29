"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useProtocolStats, useLeaderboard } from "@/hooks/usePortfolio";
import { useGlobalConfig } from "@/hooks/useGlobalConfig";
import { useHarvester } from "@/hooks/useHarvester";
import StatCard from "@/components/StatCard";
import TierBadge from "@/components/TierBadge";
import { shortenAddress, TIER_BONUS_BPS, YieldTier, formatAmount } from "@/lib/constants";

const DEMO_POOLS = [
  {
    symbol: "USDC-RE",
    name: "US Real Estate Fund",
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    description: "Tokenized US residential real estate portfolio",
    minTier: "Retail" as YieldTier,
    tvl: 4_200_000,
    participants: 142,
  },
  {
    symbol: "T-BILL",
    name: "US Treasury Bills",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    description: "Short-term US government treasury bills, tokenized",
    minTier: "Retail" as YieldTier,
    tvl: 6_800_000,
    participants: 310,
  },
  {
    symbol: "PRIV-CR",
    name: "Private Credit Fund",
    mint: "So11111111111111111111111111111111111111112",
    description: "Senior secured private credit — institutional access",
    minTier: "Institutional" as YieldTier,
    tvl: 1_450_000,
    participants: 28,
  },
];

function RegisterModal({
  pool,
  baseRateBps,
  onRegister,
  onClose,
  pending,
  error,
}: {
  pool: typeof DEMO_POOLS[0];
  baseRateBps: number;
  onRegister: (mint: string, amount: number) => void;
  onClose: () => void;
  pending: boolean;
  error?: string;
}) {
  const [amount, setAmount] = useState("");
  const apy = ((baseRateBps + TIER_BONUS_BPS[pool.minTier]) / 100).toFixed(2);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "#0f0d02", border: "1px solid var(--border-bright)",
        padding: "2rem", width: "420px", display: "flex", flexDirection: "column", gap: "1.25rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1.1rem" }}>
              {pool.name}
            </div>
            <div style={{ color: "var(--text-dim)", fontSize: "0.6rem", marginTop: "0.25rem" }}>
              REGISTER POSITION
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)" }}>
          <StatCard label="APY" value={`${apy}%`} />
          <StatCard label="Min Tier" value={pool.minTier} />
        </div>

        <div>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
            AMOUNT (tokens)
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            style={{
              width: "100%", padding: "0.625rem 0.875rem", background: "transparent",
              border: "1px solid var(--border-bright)", color: "var(--text-primary)",
              fontFamily: "JetBrains Mono", fontSize: "0.9rem", outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: "0.6rem", color: "var(--text-dim)", marginTop: "0.4rem" }}>
            ≥ 1,000,000 for Institutional tier (+20 bps) · ≥ 10,000,000 for Wholesale (+50 bps)
          </div>
        </div>

        {error && (
          <div style={{ fontSize: "0.65rem", color: "#e08080", padding: "0.5rem", border: "1px solid rgba(200,80,80,0.3)" }}>
            {error}
          </div>
        )}

        <button
          onClick={() => onRegister(pool.mint, Number(amount) * 1_000_000)}
          disabled={pending || !amount || Number(amount) <= 0}
          style={{
            padding: "0.75rem", fontSize: "0.65rem", fontWeight: 700,
            letterSpacing: "0.12em", fontFamily: "JetBrains Mono",
            background: pending ? "rgba(184,134,11,0.2)" : "var(--gold-dark)",
            color: pending ? "var(--text-dim)" : "#0a0800",
            border: "none", cursor: pending ? "not-allowed" : "pointer",
            opacity: !amount || Number(amount) <= 0 ? 0.5 : 1,
          }}
        >
          {pending ? "CONFIRMING…" : "REGISTER POSITION"}
        </button>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { publicKey } = useWallet();
  const { stats } = useProtocolStats();
  const { leaderboard, isMock } = useLeaderboard();
  const { config } = useGlobalConfig();
  const { registerPosition, registerTx, resetRegister } = useHarvester();

  const [selectedPool, setSelectedPool] = useState<typeof DEMO_POOLS[0] | null>(null);

  async function handleRegister(mint: string, amount: number) {
    await registerPosition(mint, amount);
    if (registerTx.status !== "error") {
      setSelectedPool(null);
      resetRegister();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1.4rem", fontWeight: 600 }}>
          Discover
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.14em", marginTop: "0.3rem" }}>
          AVAILABLE RWA POOLS — REGISTER POSITIONS
        </p>
      </div>

      {/* Protocol stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)" }}>
        <StatCard label="Protocol TVL"     value={`$${formatAmount(stats.totalTvl, 0)}`}      />
        <StatCard label="Total Harvested"  value={`$${formatAmount(stats.totalClaimed, 0)}`}   />
        <StatCard label="Positions"        value={stats.totalPositions.toLocaleString()}        />
        <StatCard label="Base Rate"        value={`${(stats.currentRateBps / 100).toFixed(2)}%`} sub="annual yield" />
      </div>

      {/* Pools */}
      <div>
        <div style={{ fontSize: "0.6rem", letterSpacing: "0.16em", color: "var(--text-dim)", marginBottom: "1rem" }}>
          AVAILABLE POOLS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1px", background: "var(--border)" }}>
          {DEMO_POOLS.map((pool) => {
            const apy = ((stats.currentRateBps + TIER_BONUS_BPS[pool.minTier]) / 100).toFixed(2);
            return (
              <div key={pool.mint} style={{ background: "var(--ink)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1rem", fontWeight: 600 }}>
                      {pool.name}
                    </div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.6rem", marginTop: "0.2rem" }}>{pool.symbol}</div>
                  </div>
                  <TierBadge tier={pool.minTier} />
                </div>

                <div style={{ color: "var(--text-secondary)", fontSize: "0.65rem", lineHeight: 1.7 }}>
                  {pool.description}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  {[
                    { label: "APY",          value: `${apy}%`                              },
                    { label: "TVL",          value: `$${formatAmount(pool.tvl, 0)}`        },
                    { label: "PARTICIPANTS", value: pool.participants.toLocaleString()      },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: "0.55rem", letterSpacing: "0.12em", color: "var(--text-dim)", marginBottom: "0.25rem" }}>{label}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => publicKey ? setSelectedPool(pool) : null}
                  style={{
                    padding: "0.6rem", fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.12em", fontFamily: "JetBrains Mono",
                    background: publicKey ? "transparent" : "transparent",
                    color: publicKey ? "var(--gold)" : "var(--text-dim)",
                    border: `1px solid ${publicKey ? "var(--border-bright)" : "var(--border)"}`,
                    cursor: publicKey ? "pointer" : "not-allowed",
                  }}
                >
                  {publicKey ? "REGISTER POSITION →" : "CONNECT WALLET TO REGISTER"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ border: "1px solid var(--border)" }}>
        <div style={{
          padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.16em", color: "var(--text-dim)" }}>LEADERBOARD</span>
          {isMock && <span style={{ fontSize: "0.55rem", color: "var(--text-dim)" }}>DEMO</span>}
        </div>

        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2rem 1fr 1fr 1fr",
          padding: "0.5rem 1.25rem", borderBottom: "1px solid var(--border)",
          fontSize: "0.55rem", letterSpacing: "0.14em", color: "var(--text-dim)",
          background: "rgba(184,134,11,0.02)",
        }}>
          <span>#</span>
          <span>WALLET</span>
          <span>TOTAL CLAIMED</span>
          <span style={{ textAlign: "right" }}>POSITIONS</span>
        </div>

        {leaderboard.map((entry, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "2rem 1fr 1fr 1fr",
            padding: "0.75rem 1.25rem",
            borderBottom: i < leaderboard.length - 1 ? "1px solid var(--border)" : "none",
            fontSize: "0.7rem", alignItems: "center",
          }}>
            <span style={{ color: i < 3 ? "var(--gold-light)" : "var(--text-dim)", fontWeight: i < 3 ? 600 : 400 }}>
              {entry.rank}
            </span>
            <span style={{ color: "var(--text-primary)", fontFamily: "JetBrains Mono" }}>
              {entry.wallet.length > 20 ? shortenAddress(entry.wallet) : entry.wallet}
            </span>
            <span style={{ color: "var(--gold-light)" }}>
              ${entry.totalClaimed.toLocaleString()}
            </span>
            <span style={{ textAlign: "right", color: "var(--text-secondary)" }}>
              {entry.positionCount}
            </span>
          </div>
        ))}
      </div>

      {/* Register modal */}
      {selectedPool && config && (
        <RegisterModal
          pool={selectedPool}
          baseRateBps={config.yieldRateBps}
          onRegister={handleRegister}
          onClose={() => { setSelectedPool(null); resetRegister(); }}
          pending={registerTx.status === "signing" || registerTx.status === "confirming"}
          error={registerTx.error}
        />
      )}
    </div>
  );
}