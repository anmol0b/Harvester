"use client";

import { YieldTier } from "@/lib/constants";

const TIER_STYLES: Record<YieldTier, { color: string; bg: string; label: string }> = {
  Retail:        { color: "#9a8050", bg: "rgba(154,128,80,0.1)",  label: "RETAIL"        },
  Institutional: { color: "#d4a017", bg: "rgba(212,160,23,0.12)", label: "INSTITUTIONAL" },
  Wholesale:     { color: "#f0c040", bg: "rgba(240,192,64,0.15)", label: "WHOLESALE"     },
};

export default function TierBadge({ tier }: { tier: YieldTier }) {
  const s = TIER_STYLES[tier];
  return (
    <span style={{
      fontSize: "0.55rem",
      letterSpacing: "0.14em",
      fontWeight: 600,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.color}33`,
      padding: "0.2rem 0.5rem",
      borderRadius: "2px",
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}