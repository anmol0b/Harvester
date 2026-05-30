"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useProtocolStats } from "@/hooks/usePortfolio";

function Counter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.floor(value * eased));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  if (value >= 1_000_000) return <>{(display / 1_000_000).toFixed(2)}M</>;
  if (value >= 1_000) return <>{(display / 1_000).toFixed(1)}K</>;
  return <>{display}</>;
}

function GoldCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const glow = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", move);
    let raf: number;
    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      glow.current.x += (pos.current.x - glow.current.x) * 0.08;
      glow.current.y += (pos.current.y - glow.current.y) * 0.08;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${glow.current.x - 20}px, ${glow.current.y - 20}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={glowRef} style={{
        position: "fixed", top: 0, left: 0, width: "40px", height: "40px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(184,134,11,0.3) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 9999, willChange: "transform",
      }} />
      <div ref={dotRef} style={{
        position: "fixed", top: 0, left: 0, width: "8px", height: "8px",
        borderRadius: "50%", background: "var(--gold)",
        pointerEvents: "none", zIndex: 9999, willChange: "transform",
        boxShadow: "0 0 6px var(--gold)",
      }} />
    </>
  );
}

export default function LandingPage() {
  const { stats } = useProtocolStats();
  const [mounted, setMounted] = useState(false);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    let t = 0;
    const id = setInterval(() => {
      t += 0.005;
      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${Math.sin(t) * 30}px, ${Math.cos(t * 0.7) * 20}px)`;
      }
    }, 16);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <GoldCursor />

      {/* Hero — asymmetric */}
      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "1fr 1.2fr",
        alignItems: "center", padding: "0 4rem", minHeight: "85vh",
        position: "relative", gap: "4rem",
      }}>

        {/* Left — blob + stats */}
        <div style={{ position: "relative", height: "500px", display: "flex", alignItems: "center" }}>
          <div ref={blobRef} style={{
            width: "420px", height: "420px", borderRadius: "50%",
            background: "radial-gradient(ellipse at 40% 50%, rgba(184,134,11,0.25) 0%, rgba(184,134,11,0.08) 40%, transparent 70%)",
            filter: "blur(40px)", transition: "transform 0.1s linear", position: "absolute",
          }} />
          <div style={{
            width: "200px", height: "200px", borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(212,160,23,0.3) 0%, transparent 70%)",
            filter: "blur(20px)", position: "absolute", left: "80px", top: "140px",
          }} />
          {mounted && (
            <div style={{ position: "absolute", bottom: "2rem", left: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "TVL", value: stats.totalTvl, prefix: "$", suffix: "" },
                { label: "POSITIONS", value: stats.totalPositions, prefix: "", suffix: "" },
                { label: "APY", value: stats.currentRateBps / 100, prefix: "", suffix: "%" },
              ].map(({ label, value, prefix, suffix }) => (
                <div key={label} style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "var(--text-dim)", width: "5rem" }}>{label}</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: "1.1rem", color: "var(--gold-light)", fontWeight: 700 }}>
                    {prefix}<Counter value={value} />{suffix}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.6rem", letterSpacing: "0.18em", color: "var(--text-dim)" }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#5aff8a", boxShadow: "0 0 8px #5aff8a",
              display: "inline-block", animation: "pulse 2s ease-in-out infinite",
            }} />
            LIVE ON SOLANA DEVNET
          </div>

          <h1 style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(2.5rem, 5vw, 5rem)",
            fontWeight: 700, lineHeight: 1.05, fontStyle: "italic", margin: 0,
          }}>
            <span style={{ color: "var(--gold-light)", display: "block" }}>yield on</span>
            <span style={{ color: "var(--text-primary)", display: "block" }}>what&apos;s real.</span>
          </h1>

          <p style={{ fontSize: "0.65rem", letterSpacing: "0.14em", color: "var(--text-dim)", margin: 0 }}>
            register · accrue · claim · repeat.
          </p>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.9, margin: 0, maxWidth: "360px", fontFamily: "JetBrains Mono, monospace" }}>
            Tokenized real-world assets on Solana. Yield accrues every second.
            No intermediaries. No custody. Just math.
          </p>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "0.5rem" }}>
            <Link href="/dashboard" style={{
              padding: "0.875rem 2.5rem",
              background: "linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)",
              color: "#0a0800", fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.12em",
              textDecoration: "none", textTransform: "uppercase",
            }}>
              Launch App →
            </Link>
            <a href="https://github.com/anmol0b" target="_blank" rel="noreferrer" style={{
              padding: "0.875rem 2rem", border: "1px solid var(--border-bright)",
              color: "var(--text-dim)", fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.7rem", letterSpacing: "0.12em",
              textDecoration: "none", textTransform: "uppercase",
            }}>
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--border)", borderTop: "1px solid var(--border)" }}>
        {[
          { title: "Real World Assets", body: "Register tokenized RWA positions — real estate, T-bills, private credit. Yield accrues every second.", icon: "◈" },
          { title: "Three Yield Tiers", body: "Retail, Institutional, Wholesale. Larger positions unlock higher yield multipliers automatically.", icon: "◎" },
          { title: "Non-Custodial", body: "Your tokens never leave your wallet. Positions are on-chain PDAs. Claim HRVST anytime.", icon: "◐" },
        ].map(({ title, body, icon }) => (
          <div key={title} style={{ padding: "2.5rem 2rem", background: "var(--ink)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem", color: "var(--gold)" }}>{icon}</span>
            <h3 style={{ fontFamily: "Playfair Display, serif", color: "var(--gold-light)", fontSize: "1rem", fontWeight: 600 }}>{title}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.7rem", lineHeight: 1.8, fontFamily: "JetBrains Mono, monospace" }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "1.5rem 2rem", borderTop: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.12em",
      }}>
        <span>HARVESTER PROTOCOL</span>
        <span>SOLANA DEVNET · {new Date().getFullYear()}</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}