"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { YieldChartPoint } from "@/lib/constants";

interface Props {
  data: YieldChartPoint[];
  height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f0d02",
      border: "1px solid var(--border-bright)",
      padding: "0.75rem 1rem",
      fontSize: "0.65rem",
      fontFamily: "JetBrains Mono, monospace",
    }}>
      <div style={{ color: "var(--text-dim)", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ color: "var(--gold-light)" }}>
        Daily: +{payload[0]?.value?.toFixed(4)}
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        Total: {payload[1]?.value?.toFixed(4)}
      </div>
    </div>
  );
}

export default function YieldChart({ data, height = 200 }: Props) {
  if (!data.length) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>NO CLAIM DATA YET</span>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#d4a017" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#d4a017" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#9a8050" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#9a8050" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgbsa(184,134,11,0.07)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#5a4a28", fontSize: 9, fontFamily: "JetBrains Mono" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#5a4a28", fontSize: 9, fontFamily: "JetBrains Mono" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="yield"
          stroke="#d4a017"
          strokeWidth={1.5}
          fill="url(#yieldGrad)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#9a8050"
          strokeWidth={1}
          fill="url(#cumGrad)"
          dot={false}
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}