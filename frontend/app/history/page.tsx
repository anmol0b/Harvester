"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useClaimHistory } from "@/hooks/usePortfolio";
import { shortenAddress, formatDate } from "@/lib/constants";

export default function HistoryPage() {
  const { publicKey } = useWallet();
  const [page, setPage] = useState(1);
  const { history, isLoading, isMock, totalPages } = useClaimHistory(page, 10);

  if (!publicKey) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", paddingTop: "4rem" }}>
        <div style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1.1rem" }}>
          Connect your wallet to view claim history
        </div>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1.4rem", fontWeight: 600 }}>
            Claim History
          </h2>
          <p style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.14em", marginTop: "0.3rem" }}>
            {history?.total ?? 0} TOTAL CLAIMS
            {isMock && <span style={{ marginLeft: "0.75rem" }}>— DEMO DATA</span>}
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--border)", overflow: "hidden" }}>

        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 1fr",
          padding: "0.625rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          fontSize: "0.55rem",
          letterSpacing: "0.14em",
          color: "var(--text-dim)",
          background: "rgba(184,134,11,0.03)",
        }}>
          <span>DATE</span>
          <span>ASSET</span>
          <span>YIELD AMOUNT</span>
          <span>TOTAL CLAIMED</span>
          <span style={{ textAlign: "right" }}>TX</span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ padding: "2rem 1.25rem", color: "var(--text-dim)", fontSize: "0.7rem" }}>
            LOADING…
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !history?.entries.length && (
          <div style={{ padding: "3rem 1.25rem", textAlign: "center", color: "var(--text-dim)", fontSize: "0.7rem" }}>
            No claim history yet. Claim yield from your positions to see records here.
          </div>
        )}

        {/* Rows */}
        {history?.entries.map((entry, i) => (
          <div
            key={entry.txSignature}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 1fr",
              padding: "0.875rem 1.25rem",
              borderBottom: i < (history.entries.length - 1) ? "1px solid var(--border)" : "none",
              fontSize: "0.7rem",
              alignItems: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(184,134,11,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ color: "var(--text-secondary)" }}>
              {formatDate(entry.timestamp)}
            </span>
            <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>
              {entry.symbol}
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              +{entry.yieldAmount.toFixed(6)}
              <span style={{ color: "var(--text-dim)", marginLeft: "0.35rem", fontSize: "0.6rem" }}>HRVST</span>
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              {entry.totalClaimed.toFixed(4)}
              <span style={{ color: "var(--text-dim)", marginLeft: "0.35rem", fontSize: "0.6rem" }}>HRVST</span>
            </span>
            <div style={{ textAlign: "right" }}>
              <a
                href={`https://explorer.solana.com/tx/${entry.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--text-dim)",
                  textDecoration: "none",
                  fontSize: "0.6rem",
                  letterSpacing: "0.08em",
                  borderBottom: "1px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--gold-light)";
                  (e.currentTarget as HTMLElement).style.borderBottomColor = "var(--gold-light)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-dim)";
                  (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent";
                }}
              >
                {shortenAddress(entry.txSignature, 6)} ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "0.4rem 0.75rem", fontSize: "0.65rem", fontFamily: "JetBrains Mono",
              background: "transparent", color: page === 1 ? "var(--text-dim)" : "var(--gold)",
              border: "1px solid var(--border)", cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            ← PREV
          </button>
          <span style={{ fontSize: "0.6rem", color: "var(--text-dim)", padding: "0 0.5rem" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "0.4rem 0.75rem", fontSize: "0.65rem", fontFamily: "JetBrains Mono",
              background: "transparent", color: page === totalPages ? "var(--text-dim)" : "var(--gold)",
              border: "1px solid var(--border)", cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}