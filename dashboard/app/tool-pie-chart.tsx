"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ToolCost } from "@/lib/db";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

export function ToolPieChart({ data }: { data: ToolCost[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">아직 데이터가 없어요.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="cost" nameKey="tool" cx="50%" cy="50%" outerRadius={80} label={(d) => d.name}>
          {data.map((entry, i) => (
            <Cell key={entry.tool} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`$${Number(v).toFixed(4)}`, "비용"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
