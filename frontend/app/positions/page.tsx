"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useGlobalConfig } from "@/hooks/useGlobalConfig";
import { useHarvester } from "@/hooks/useHarvester";
import TierBadge from "@/components/TierBadge";
import { EnrichedPosition, formatDate, formatAmount } from "@/lib/constants";


function PositionCard({
  pos,
  yieldMint,
  onClaim,
  onClose,
  claimPending,
  closePending,
}: {
  pos: EnrichedPosition;
  yieldMint: string;
  onClaim: (mint: string, yieldMint: string) => void;
  onClose: (mint: string) => void;
  claimPending: boolean;
  closePending: boolean;
}) {
  const [confirmClose, setConfirmClose] = useState(false);
  

  return (
    <div style={{ border: "1px solid var(--border)", background: "rgba(184,134,11,0.02)" }}>
      {/* Card header */}
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color: "var(--gold-light)", fontWeight: 700, fontSize: "1rem", fontFamily: "Playfair Display, serif" }}>
            {pos.symbol}
          </span>
          <TierBadge tier={pos.tier} />
        </div>
        <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", fontFamily: "JetBrains Mono" }}>
          {pos.apy.toFixed(2)}% APY
        </span>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "var(--ink)" }}>
        {[
          { label: "DEPOSITED",    value: formatAmount(pos.amountUi, 0),           unit: pos.symbol },
          { label: "ACCRUED",      value: pos.accruedYieldUi.toFixed(6),           unit: "HRVST"    },
          { label: "TOTAL EARNED", value: pos.totalClaimedUi.toFixed(4),           unit: "HRVST"    },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ padding: "0.875rem 1rem", background: "var(--ink)" }}>
            <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", color: "var(--text-dim)", marginBottom: "0.3rem" }}>{label}</div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>{value}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "0.875rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
      }}>
        <div style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>
          LAST CLAIM {formatDate(new Date(pos.last_claim_timestamp).getTime() / 1000)}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* Claim button */}
          <button
            onClick={() => onClaim(pos.mint, yieldMint)}
            disabled={claimPending || !yieldMint}
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              padding: "0.4rem 1rem",
              background: claimPending ? "rgba(184,134,11,0.2)" : "var(--gold-dark)",
              color: claimPending ? "var(--text-dim)" : "#0a0800",
              border: "none",
              cursor: claimPending || pos.accruedYieldUi <= 0 ? "not-allowed" : "pointer",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700,
              opacity: pos.accruedYieldUi <= 0 ? 0.4 : 1,
            }}
          >
            {claimPending ? "CLAIMING…" : "CLAIM YIELD"}
          </button>

          {/* Close button */}
          {!confirmClose ? (
            <button
              onClick={() => setConfirmClose(true)}
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                padding: "0.4rem 0.75rem",
                background: "transparent",
                color: "var(--text-dim)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              CLOSE
            </button>
          ) : (
            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Sure?</span>
              <button
                onClick={() => { onClose(pos.mint); setConfirmClose(false); }}
                disabled={closePending}
                style={{
                  fontSize: "0.6rem", padding: "0.4rem 0.6rem",
                  background: "rgba(180,50,50,0.15)", color: "#e05050",
                  border: "1px solid rgba(180,50,50,0.3)", cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                YES
              </button>
              <button
                onClick={() => setConfirmClose(false)}
                style={{
                  fontSize: "0.6rem", padding: "0.4rem 0.6rem",
                  background: "transparent", color: "var(--text-dim)",
                  border: "1px solid var(--border)", cursor: "pointer",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                NO
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mint address */}
      <div style={{
        padding: "0.5rem 1.25rem",
        borderTop: "1px solid var(--border)",
        fontSize: "0.55rem",
        color: "var(--text-dim)",
        fontFamily: "JetBrains Mono",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        MINT {pos.mint}
      </div>
    </div>
  );
}

export default function PositionsPage() {
  const { publicKey } = useWallet();
  const { portfolio, isLoading, refresh } = usePortfolio();
  const { config } = useGlobalConfig();
  const { claimYield, closePosition, claimTx, closeTx } = useHarvester();
  const [activeMint, setActiveMint] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleClaim(mint: string, yieldMint: string) {
    if (!yieldMint) {
      alert("Protocol config not loaded — is the program initialized on devnet?");
      return;
    }
    setActiveMint(mint);
    await claimYield(mint, yieldMint);
    await refresh();
    setActiveMint(null);
  }

  async function handleClose(mint: string) {
    setActiveMint(mint);
    await closePosition(mint);
    await refresh();
    setActiveMint(null);
  }

  if (!publicKey) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", paddingTop: "4rem" }}>
        <div style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1.1rem" }}>
          Connect your wallet to view positions
        </div>
        {mounted && <WalletMultiButton />}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1.4rem", fontWeight: 600 }}>
            Positions
          </h2>
          <p style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.14em", marginTop: "0.3rem" }}>
            {portfolio?.positions.length ?? 0} ACTIVE POSITION{portfolio?.positions.length !== 1 ? "S" : ""}
          </p>
        </div>
      </div>

      {/* Tx status banner */}
      {(claimTx.status === "success" || closeTx.status === "success") && (
        <div style={{
          padding: "0.75rem 1.25rem",
          border: "1px solid rgba(100,200,100,0.3)",
          background: "rgba(100,200,100,0.05)",
          fontSize: "0.65rem",
          color: "#80d080",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span>TRANSACTION CONFIRMED</span>
          {(claimTx.signature || closeTx.signature) && (
            <a
              href={`https://explorer.solana.com/tx/${claimTx.signature ?? closeTx.signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#80d080", textDecoration: "underline" }}
            >
              VIEW ON EXPLORER ↗
            </a>
          )}
        </div>
      )}
      {(claimTx.status === "error" || closeTx.status === "error") && (
        <div style={{
          padding: "0.75rem 1.25rem",
          border: "1px solid rgba(200,80,80,0.3)",
          background: "rgba(200,80,80,0.05)",
          fontSize: "0.65rem",
          color: "#e08080",
        }}>
          ERROR — {claimTx.error ?? closeTx.error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ color: "var(--text-dim)", fontSize: "0.7rem", padding: "2rem 0" }}>LOADING POSITIONS…</div>
      )}

      {/* Empty state */}
      {!isLoading && portfolio?.positions.length === 0 && (
        <div style={{
          border: "1px solid var(--border)", padding: "3rem", textAlign: "center",
          color: "var(--text-dim)", fontSize: "0.7rem", lineHeight: 2,
        }}>
          <div style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1rem", marginBottom: "0.75rem" }}>
            No positions yet
          </div>
          Use the Discover page to find RWA pools and register your first position.
        </div>
      )}

      {/* Position cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1px", background: "var(--ink)" }}>
        {portfolio?.positions.map((pos) => (
          <PositionCard
            key={pos.id}
            pos={pos}
            yieldMint={config?.yieldMint ?? ""}
            onClaim={handleClaim}
            onClose={handleClose}
            claimPending={activeMint === pos.mint && (claimTx.status === "signing" || claimTx.status === "confirming")}
            closePending={activeMint === pos.mint && (closeTx.status === "signing" || closeTx.status === "confirming")}
          />
        ))}
      </div>
    </div>
  );
}