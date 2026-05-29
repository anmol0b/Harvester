"use client";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  dimmed?: boolean;
}

export default function StatCard({ label, value, sub, dimmed }: StatCardProps) {
  return (
    <div style={{
      border: "1px solid var(--border)",
      padding: "1.25rem 1.5rem",
      background: "rgba(184,134,11,0.03)",
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    }}>
      <span style={{
        fontSize: "0.6rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--text-dim)",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "1.5rem",
        fontWeight: 600,
        color: dimmed ? "var(--text-secondary)" : "var(--gold-light)",
        fontFamily: "JetBrains Mono, monospace",
        lineHeight: 1.2,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}